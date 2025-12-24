
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Waveform, ArrowLeft } from 'lucide-react';
import { decode, decodeAudioData, encode } from '../services/geminiService';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const VoiceSupport: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language;
  const t = translations[language || 'en'] || translations.en;
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState(t.tapToStart);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  /**
   * Starts a Live API session for real-time voice interaction.
   */
  const startSession = async () => {
    try {
      setStatus(language === 'bn' ? 'সংযুক্ত হচ্ছে...' : 'Connecting...');
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error("Gemini API Key is missing");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputAudioContextRef.current.resume();
      await audioContextRef.current.resume();
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const userContext = `User Profile: Name: ${user.name}, Week: ${user.currentWeek}, Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;

      const systemInstruction = language === 'bn'
        ? `আপনি একজন শান্ত, সহায়ক মাতৃত্বকালীন নার্স যার নাম কোরে। ${userContext} আপনার কণ্ঠস্বর আরামদায়ক। আপনি গর্ভবতী মায়েদের মানসিক চাপ, গভীর রাতের প্রশ্ন বা শুধু কথা শোনার জন্য সাহায্য করেন। উত্তরগুলি ছোট এবং কথোপকথনমূলক রাখুন। অবশ্যই বাংলায় কথা বলুন।`
        : `You are a calm, supportive maternity nurse named Kore. ${userContext} Your voice is soothing. You help expectant mothers with stress, late-night questions, or just provide a listening ear. Keep responses short and conversational. Speak in English.`;

      if (!(ai as any).live) {
        throw new Error("Live API not supported by this SDK version.");
      }

      const session = await (ai as any).live.connect({
        model: 'models/gemini-2.0-flash-exp',
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
        },
        callbacks: {
          onopen: () => {
            console.log("Live API: Connected");
            setStatus(t.listening);
            setIsActive(true);
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              try {
                sessionRef.current.sendRealtimeInput({ mediaChunks: [pcmBlob] });
              } catch (sendErr) {
                console.error("Error sending audio chunk:", sendErr);
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: any) => {
            console.log("Live API Message:", message);
            try {
              // Process model turn audio output
              const parts = message.serverContent?.modelTurn?.parts;
              const base64Audio = parts?.find((p: any) => p.inlineData)?.inlineData?.data;
              
              if (base64Audio && audioContextRef.current) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                
                // Schedule playback for gapless audio stream
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }

              // Handle interruptions (e.g., user speaking over the model)
              if (message.serverContent?.interrupted) {
                console.log("Live API: Interrupted");
                for (const source of sourcesRef.current.values()) {
                  try { source.stop(); } catch (e) {}
                }
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            } catch (err) {
              console.error("Error processing voice message:", err);
            }
          },
          onerror: (e) => {
            console.error("Live API Error Callback:", e);
            setStatus(language === 'bn' ? 'ত্রুটি ঘটেছে' : 'Error occurred');
          },
          onclose: () => {
            console.log("Live API: Closed");
            setIsActive(false);
            setStatus(language === 'bn' ? 'কল শেষ হয়েছে' : 'Call ended');
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to start session:", err);
      setStatus(language === 'bn' ? 'সংযোগ করতে ব্যর্থ হয়েছে' : 'Failed to connect');
    }
  };

  /**
   * Closes the Live API session and stops media tracks.
   */
  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsActive(false);
    setStatus(t.tapToStart);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 relative">
      <button 
        onClick={onBack} 
        className="absolute top-6 left-6 p-2 hover:bg-pink-50 rounded-full transition-colors z-10"
      >
        <ArrowLeft size={20} className="text-gray-600" />
      </button>
      
      <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isActive ? 'bg-pink-100 scale-105' : 'bg-gray-100'}`}>
        <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-inner ${isActive ? 'bg-pink-500 animate-pulse' : 'bg-white'}`}>
          {isActive ? <Mic size={48} className="text-white" /> : <MicOff size={48} className="text-gray-300" />}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">{isActive ? t.speakingWith : t.voiceCompanion}</h2>
        <p className={`${isActive ? 'text-pink-600' : 'text-gray-500'} font-bold uppercase tracking-widest text-xs`}>{status}</p>
      </div>

      <div className="max-w-xs text-sm text-gray-500 leading-relaxed font-medium">
        {language === 'bn' 
          ? 'বিশ্রামের সময়, অভিভূত বোধ করলে বা প্রস্তুতির সময় এটি আপনার জন্য উপযুক্ত।'
          : 'Perfect for when you\'re resting, feeling overwhelmed, or have your hands full with baby prep.'}
      </div>

      <div className="flex gap-4">
        {isActive ? (
          <button 
            onClick={stopSession}
            className="px-8 py-4 bg-red-500 text-white rounded-full font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <PhoneOff size={20} /> {t.endCall}
          </button>
        ) : (
          <button 
            onClick={startSession}
            className="px-10 py-5 bg-pink-500 text-white rounded-full font-bold text-lg flex items-center gap-2 shadow-xl shadow-pink-200 active:scale-95 transition-all"
          >
            <Mic size={24} /> {t.connectNow}
          </button>
        )}
      </div>
      
      {isActive && (
        <div className="flex gap-1.5 items-center h-10">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 bg-pink-400 rounded-full animate-bounce" 
              style={{ 
                height: `${Math.random() * 32 + 8}px`,
                animationDelay: `${i * 0.1}s` 
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceSupport;

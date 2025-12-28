import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, ArrowLeft, AlertCircle, Volume2, Sparkles, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { translations } from '../translations';
import { generateAIResponse, buildMaternitySystemInstruction, isAIServiceAvailable } from '../services/aiService';

// SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const VoiceSupport: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language;
  const t = translations[language || 'en'] || translations.en;
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState(t.tapToStart);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const conversationRef = useRef<{ role: 'user' | 'assistant', content: string }[]>([]);
  const isActiveRef = useRef(false);
  const errorCountRef = useRef(0);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => { stopSession(); };
  }, []);

  const startSession = async () => {
    try {
      setError(null);
      
      if (!isAIServiceAvailable()) {
        throw new Error(language === 'bn' ? 'AI সেবা উপলব্ধ নেই' : 'AI service unavailable');
      }
      
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        throw new Error(language === 'bn' ? 'ব্রাউজার স্পিচ সাপোর্ট করে না' : 'Browser does not support speech recognition');
      }
      
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setStatus(t.listening);
      };
      
      recognition.onresult = (event: any) => {
        errorCountRef.current = 0; // Reset error count on successful result
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }
        
        setTranscript(interimTranscript || finalTranscript);
        
        if (finalTranscript.trim()) {
          handleUserSpeech(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('[Voice] Recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          setError(language === 'bn' ? 'মাইক্রোফোন অ্যাক্সেস প্রত্যাখ্যান' : 'Microphone access denied');
          stopSession();
          return;
        }
        
        if (event.error === 'network') {
          errorCountRef.current++;
          if (errorCountRef.current >= 3) {
            setError(language === 'bn' ? 'নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ পরীক্ষা করুন।' : 'Network error. Please check your internet connection.');
            stopSession();
            return;
          }
        }
        
        if (event.error === 'no-speech') {
          // User didn't say anything, just restart
          errorCountRef.current = 0;
        }
        
        // Retry for recoverable errors (but not aborted)
        if (event.error !== 'aborted' && isActiveRef.current && errorCountRef.current < 5) {
          setTimeout(() => {
            if (isActiveRef.current && recognitionRef.current) {
              try { recognitionRef.current.start(); } catch(e) {}
            }
          }, 1000);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (isActiveRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && isActiveRef.current) {
              try { recognitionRef.current.start(); } catch(e) {}
            }
          }, 300);
        }
      };
      
      recognitionRef.current = recognition;
      conversationRef.current = [];
      isActiveRef.current = true;
      errorCountRef.current = 0;
      setIsActive(true);
      recognition.start();
      
      const greeting = language === 'bn' 
        ? 'হ্যালো! আমি আপনার মাতৃত্বকালীন সহায়ক। আপনি কি জানতে চান?'
        : 'Hello! I am your maternity companion. How can I help you today?';
      speak(greeting);
      
    } catch (err: any) {
      console.error('[Voice] Start error:', err);
      setError(err.message);
      setIsActive(false);
    }
  };

  const handleUserSpeech = async (userText: string) => {
    if (!userText.trim()) return;
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    setTranscript('');
    setStatus(language === 'bn' ? 'চিন্তা করছি...' : 'Thinking...');
    
    conversationRef.current.push({ role: 'user', content: userText });
    
    try {
      const systemInstruction = buildMaternitySystemInstruction(user, language);
      
      const response = await generateAIResponse({
        messages: [
          ...conversationRef.current,
          { role: 'user', content: userText + (language === 'bn' ? '\n\nসংক্ষেপে বাংলায় উত্তর দিন।' : '\n\nKeep your response brief and conversational.') }
        ],
        systemInstruction,
        temperature: 0.8,
        maxTokens: 300
      });
      
      const aiText = response.content;
      conversationRef.current.push({ role: 'assistant', content: aiText });
      setLastAiResponse(aiText);
      speak(aiText);
      
    } catch (err: any) {
      console.error('[Voice] AI error:', err);
      const errorMsg = language === 'bn' ? 'দুঃখিত, আবার চেষ্টা করুন।' : 'Sorry, please try again.';
      speak(errorMsg);
    }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/###?\s*/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\n+/g, '. ');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      language === 'bn' 
        ? v.lang.startsWith('bn') 
        : (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus(language === 'bn' ? 'বলছে...' : 'Speaking...');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus(t.listening);
      if (isActiveRef.current && recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch(e) {}
        }, 300);
      }
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (isActiveRef.current && recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch(e) {}
        }, 300);
      }
    };
    
    synthRef.current.speak(utterance);
  };

  const stopSession = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    isActiveRef.current = false;
    errorCountRef.current = 0;
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setStatus(t.tapToStart);
    setTranscript('');
    setError(null);
    conversationRef.current = [];
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-rose-50 via-pink-50 to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl" />
        {isActive && (
          <>
            <div className="absolute top-1/4 left-10 w-3 h-3 bg-pink-300 rounded-full animate-ping" />
            <div className="absolute top-1/3 right-12 w-2 h-2 bg-rose-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-1/3 left-16 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          </>
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2.5 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm transition-all">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
          <Sparkles size={16} className="text-pink-500" />
          <span className="text-sm font-semibold text-gray-700">{language === 'bn' ? 'AI সহায়ক' : 'AI Companion'}</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Voice visualization orb */}
        <div className="relative mb-8">
          {/* Outer glow rings */}
          {isActive && (
            <>
              <div className={'absolute inset-0 rounded-full transition-all duration-700 ' + (isSpeaking ? 'bg-purple-400/20 scale-150 animate-pulse' : isListening ? 'bg-pink-400/20 scale-150 animate-pulse' : 'bg-pink-300/10 scale-125')} style={{ filter: 'blur(20px)' }} />
              <div className={'absolute inset-0 rounded-full transition-all duration-500 ' + (isSpeaking ? 'bg-purple-400/30 scale-125' : isListening ? 'bg-pink-400/30 scale-125' : 'bg-pink-300/20 scale-110')} style={{ filter: 'blur(10px)' }} />
            </>
          )}
          
          {/* Main orb */}
          <div className={'w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 relative ' + (isActive ? 'shadow-2xl' : 'shadow-lg')}>
            <div className={'absolute inset-0 rounded-full transition-all duration-500 ' + (isSpeaking ? 'bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500' : isListening ? 'bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600' : isActive ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-gray-100 to-gray-200')} />
            
            {/* Inner circle */}
            <div className={'relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ' + (isActive ? 'bg-white/20 backdrop-blur-sm' : 'bg-white shadow-inner')}>
              {isSpeaking ? (
                <Volume2 size={44} className="text-white drop-shadow-lg" />
              ) : isActive ? (
                <Mic size={44} className="text-white drop-shadow-lg" />
              ) : (
                <MicOff size={44} className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Sound wave visualization */}
          {isActive && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1 items-end h-8">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className={'w-1 rounded-full transition-all duration-150 ' + (isSpeaking ? 'bg-purple-400' : isListening ? 'bg-pink-400' : 'bg-gray-300')}
                  style={{
                    height: isActive ? `${12 + Math.sin((i + Date.now() / 200) * 0.5) * 12}px` : '4px',
                    animationDelay: `${i * 0.05}s`,
                    opacity: isActive ? 0.6 + (i % 3) * 0.2 : 0.3
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {isActive ? t.speakingWith : t.voiceCompanion}
          </h2>
          <div className={'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ' + (error ? 'bg-red-100 text-red-600' : isSpeaking ? 'bg-purple-100 text-purple-600' : isListening ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500')}>
            {isListening && <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />}
            {isSpeaking && <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />}
            {status}
          </div>
        </div>

        {/* Transcript bubble */}
        {transcript && (
          <div className="w-full max-w-sm mb-4 animate-fadeIn">
            <div className="bg-white rounded-2xl rounded-br-sm p-4 shadow-md border border-pink-100">
              <p className="text-gray-700 text-sm italic">"{transcript}"</p>
            </div>
          </div>
        )}

        {/* AI Response bubble */}
        {lastAiResponse && isActive && !transcript && (
          <div className="w-full max-w-sm mb-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl rounded-bl-sm p-4 shadow-lg">
              <div className="flex items-start gap-2">
                <MessageCircle size={16} className="text-white/80 mt-0.5 flex-shrink-0" />
                <p className="text-white text-sm line-clamp-3">{lastAiResponse.replace(/\*\*/g, '').replace(/\*/g, '').slice(0, 150)}{lastAiResponse.length > 150 ? '...' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm max-w-sm mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Helper text */}
        {!isActive && (
          <p className="max-w-xs text-sm text-gray-400 text-center leading-relaxed">
            {language === 'bn' ? 'বিশ্রামের সময় কথা বলুন, টাইপ করার দরকার নেই।' : 'Talk hands-free while resting. No typing needed.'}
          </p>
        )}
      </div>

      {/* Bottom action area */}
      <div className="relative z-10 p-6 pb-8">
        <div className="flex justify-center">
          {isActive ? (
            <button
              onClick={stopSession}
              className="group flex items-center gap-3 px-8 py-4 bg-white border-2 border-red-200 text-red-500 rounded-full font-bold shadow-lg hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <PhoneOff size={20} className="text-white" />
              </div>
              <span>{t.endCall}</span>
            </button>
          ) : (
            <button
              onClick={startSession}
              className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold text-lg shadow-xl shadow-pink-200/50 active:scale-95 transition-all hover:shadow-2xl hover:shadow-pink-300/50"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Mic size={24} className="text-white" />
              </div>
              <span>{t.connectNow}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceSupport;

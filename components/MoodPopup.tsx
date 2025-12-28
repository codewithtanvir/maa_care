
import React, { useState } from 'react';
import { Smile, Frown, Zap, Coffee, Ghost, X, Loader2, Sparkles } from 'lucide-react';
import { LogEntry, Language, UserProfile } from '../types';
import { translations } from '../translations';
import { getAIChatResponse } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onClose: () => void;
}

const MoodPopup: React.FC<Props> = ({ user, onClose }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;
  const [selectedMood, setSelectedMood] = useState<LogEntry['mood'] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const moods: { type: LogEntry['mood']; icon: any; color: string; label: string; labelBn: string }[] = [
    { type: 'happy', icon: Smile, color: 'text-yellow-500', label: 'Happy', labelBn: 'খুশি' },
    { type: 'excited', icon: Zap, color: 'text-orange-500', label: 'Excited', labelBn: 'উত্তেজিত' },
    { type: 'tired', icon: Coffee, color: 'text-blue-500', label: 'Tired', labelBn: 'ক্লান্ত' },
    { type: 'anxious', icon: Ghost, color: 'text-purple-500', label: 'Anxious', labelBn: 'চিন্তিত' },
    { type: 'nauseous', icon: Frown, color: 'text-green-500', label: 'Nauseous', labelBn: 'অসুস্থ' },
  ];

  const handleMoodSelect = async (mood: LogEntry['mood']) => {
    setSelectedMood(mood);
    setIsSaving(true);
    
    try {
      // Save to Supabase
      const newLog = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        mood: mood,
        symptoms: [],
        notes: 'Daily mood check-in',
      };

      await supabase.from('health_logs').insert([newLog]);

      // Get AI Response
      const moodLabel = moods.find(m => m.type === mood)?.label || mood;
      const prompt = language === 'bn'
        ? `আমি আজ "${moodLabel}" অনুভব করছি। আমি আমার গর্ভাবস্থার ${user.currentWeek} সপ্তাহে আছি। মা কেয়ার এআই হিসেবে আমাকে একটি অত্যন্ত উষ্ণ, উৎসাহমূলক এবং ব্যক্তিগত পরামর্শ দিন যা আমার বর্তমান মুড এবং সপ্তাহের সাথে সামঞ্জস্যপূর্ণ। ১-২ বাক্য।`
        : `I am feeling "${moodLabel}" today and I am in week ${user.currentWeek} of my pregnancy. As Maa Care AI, give me a highly warm, encouraging, and personalized piece of advice or comfort that matches my current mood and pregnancy stage. Keep it to 1-2 sentences.`;
      
      const response = await getAIChatResponse([], prompt, user);
      setAiResponse(response);
    } catch (e) {
      console.error("Error in mood popup:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-pink-100 relative overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500" onClick={(e) => e.stopPropagation()}>
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-100/40 to-rose-100/20 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-100/30 to-pink-100/20 rounded-full -ml-20 -mb-20 blur-3xl" />
        
        {!aiResponse ? (
          <>
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-90 z-50"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 text-center space-y-8">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-pink-200 animate-bounce-slow">
                <Sparkles size={36} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                  {language === 'bn' ? 'আজ আপনার মন কেমন?' : 'How are you feeling?'}
                </h2>
                <p className="text-sm font-bold text-pink-500 uppercase tracking-widest">
                  {language === 'bn' ? 'মুড চেক-ইন' : 'Daily Mood Check-in'}
                </p>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {moods.map((m) => (
                  <button
                    key={m.type}
                    onClick={() => !isSaving && handleMoodSelect(m.type)}
                    disabled={isSaving}
                    className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-300 ${
                      selectedMood === m.type 
                        ? 'bg-pink-50 ring-2 ring-pink-500 scale-110 shadow-lg shadow-pink-100' 
                        : 'hover:bg-slate-50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${selectedMood === m.type ? 'bg-white' : ''}`}>
                      <m.icon className={`w-8 h-8 ${m.color}`} />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                      {language === 'bn' ? m.labelBn : m.label}
                    </span>
                  </button>
                ))}
              </div>

              {isSaving && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs font-black text-pink-600 uppercase tracking-widest">
                    {language === 'bn' ? 'এআই পরামর্শ তৈরি হচ্ছে...' : 'Generating AI Comfort...'}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative z-10 text-center space-y-8 py-2 animate-in fade-in zoom-in duration-500">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-pink-100 rounded-[2.5rem] animate-ping opacity-20" />
              <div className="relative w-full h-full bg-gradient-to-br from-pink-50 to-rose-50 rounded-[2.5rem] flex items-center justify-center text-pink-500 shadow-inner border border-pink-100">
                {(() => {
                  const MoodIcon = moods.find(m => m.type === selectedMood)?.icon;
                  return MoodIcon ? <MoodIcon size={48} className="drop-shadow-sm" /> : null;
                })()}
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-block px-4 py-1.5 bg-indigo-50 rounded-full">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  {language === 'bn' ? 'মা কেয়ার এআই বার্তা' : 'Maa Care AI Message'}
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-2 -top-2 text-pink-200 opacity-50">
                  <Sparkles size={24} />
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-[2rem] border border-pink-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                  <p className="text-gray-800 font-bold leading-relaxed text-lg tracking-tight">
                    "{aiResponse}"
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-pink-200 hover:shadow-pink-300 active:scale-[0.98] transition-all"
            >
              {language === 'bn' ? 'ধন্যবাদ' : 'Thank You'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodPopup;

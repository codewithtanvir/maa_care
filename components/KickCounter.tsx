
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Timer, RotateCcw, Footprints, History, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Session {
  id: string;
  count: number;
  duration: number; // in seconds
  date: string;
}

interface Props {
  onBack: () => void;
  user: UserProfile;
}

const KickCounter: React.FC<Props> = ({ onBack, user }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user.id]);

  const fetchHistory = async () => {
    if (!user.id) return;
    setIsLoading(true);
    setHistory([]); // Clear previous history to prevent flicker between accounts
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('kick_history')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (data?.kick_history) {
        setHistory(data.kick_history as Session[]);
      }
    } catch (e) {
      console.error("Error fetching kick history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isActive && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const handleKick = () => {
    if (!isActive) {
      setIsActive(true);
      setStartTime(Date.now());
    }
    const newCount = count + 1;
    setCount(newCount);
    
    if (newCount === 10) {
      saveSession(newCount);
      setIsActive(false);
      alert(language === 'bn' ? '১০টি লাথি রেকর্ড করা হয়েছে! চমৎকার!' : '10 Kicks recorded! That was fast!');
    }
  };

  const saveSession = async (finalCount: number) => {
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const newSession: Session = {
      id: Date.now().toString(),
      count: finalCount,
      duration,
      date: new Date().toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    setCount(0);
    setElapsed(0);
    setStartTime(null);

    // Sync to Supabase
    try {
      await supabase
        .from('profiles')
        .update({ kick_history: updatedHistory })
        .eq('id', user.id);
    } catch (e) {
      console.error("Error saving kick session:", e);
    }
  };

  const resetCounter = () => {
    setCount(0);
    setElapsed(0);
    setIsActive(false);
    setStartTime(null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="p-6 space-y-8 pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 hover:bg-pink-50 rounded-2xl transition-all text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{t.kickCounter}</h1>
      </header>

      <div className="flex flex-col items-center py-4 space-y-10">
        <div className="relative flex items-center justify-center">
          {/* Circular Progress Background */}
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-pink-50"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 110}
              strokeDashoffset={2 * Math.PI * 110 * (1 - count / 10)}
              strokeLinecap="round"
              className="text-pink-500 transition-all duration-500 ease-out"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{t.targetKicks}</p>
            <div className="text-7xl font-black text-gray-800 tabular-nums leading-none">{count}</div>
            <div className="flex items-center gap-1.5 text-pink-500 mt-4 font-black bg-pink-50 px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
              <Timer size={16} /> {formatTime(elapsed)}
            </div>
          </div>
        </div>

        <button 
          onClick={handleKick}
          className="group relative w-44 h-44 rounded-[3rem] bg-gradient-to-br from-pink-500 to-rose-500 flex flex-col items-center justify-center text-white shadow-2xl shadow-pink-200 active:scale-90 transition-all border-8 border-white ring-1 ring-pink-100 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Footprints size={48} className="mb-2 drop-shadow-lg group-hover:scale-110 transition-transform" />
          <span className="font-black text-sm uppercase tracking-[0.2em] drop-shadow-md">{t.kick}</span>
        </button>

        <button 
          onClick={resetCounter}
          className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 hover:text-gray-600 transition-all"
        >
          <RotateCcw size={16} /> {language === 'bn' ? 'রিসেট' : 'Reset'}
        </button>
      </div>

      <section className="space-y-6 pb-24">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <History size={16} /> {t.history}
          </h3>
          <span className="text-xs font-bold text-gray-400">{history.length} {language === 'bn' ? 'সেশন' : 'Sessions'}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
            <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <Footprints size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'আজ কোন সেশন নেই' : 'No sessions today'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-pink-50 flex justify-between items-center shadow-sm hover:border-pink-200 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-inner group-hover:scale-110 transition-transform">
                    <Footprints size={20} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-lg tracking-tight">{s.count} {language === 'bn' ? 'লাথি' : 'Kicks'}</p>
                    <p className="text-xs text-gray-500 font-black uppercase tracking-widest">{s.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-pink-500 tabular-nums">{formatTime(s.duration)}</p>
                  <p className="text-xs text-gray-500 uppercase font-black tracking-widest">{t.duration}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default KickCounter;


import React, { useState, useEffect } from 'react';
import { ArrowLeft, Timer, RotateCcw, Footprints, History, Loader2 } from 'lucide-react';
import { Language, UserProfile } from '../types';
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
    <div className="p-6 space-y-6 pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-all">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{t.kickCounter}</h1>
      </header>

      <div className="flex flex-col items-center py-8 space-y-8">
        <div className="text-center">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{t.targetKicks}</p>
          <div className="text-8xl font-black text-pink-500 tabular-nums drop-shadow-sm">{count}</div>
          <div className="flex items-center justify-center gap-2 text-gray-500 mt-4 font-bold bg-pink-50 px-4 py-2 rounded-full text-sm">
            <Timer size={16} /> {formatTime(elapsed)}
          </div>
        </div>

        <button 
          onClick={handleKick}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex flex-col items-center justify-center text-white shadow-2xl shadow-pink-200 active:scale-90 transition-all border-8 border-pink-50 ring-4 ring-pink-100"
        >
          <Footprints size={48} className="mb-2" />
          <span className="font-bold text-xl uppercase tracking-widest">{t.kick}</span>
        </button>

        <div className="flex gap-4">
          <button 
            onClick={() => { setIsActive(false); setCount(0); setElapsed(0); setStartTime(null); }}
            className="p-4 bg-gray-100 text-gray-500 rounded-full active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <section className="space-y-4 pb-24">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 uppercase tracking-tight">
          <History size={18} /> {t.history}
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-pink-500" size={32} />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-300 italic py-12 text-sm">{language === 'bn' ? 'আজ কোন সেশন রেকর্ড করা হয়নি।' : 'No sessions recorded today.'}</p>
        ) : (
          history.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-3xl border border-pink-50 flex justify-between items-center shadow-sm hover:border-pink-200 transition-all">
              <div>
                <p className="font-bold text-gray-800 text-lg">{s.count} {language === 'bn' ? 'লাথি' : 'kicks'}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-pink-500">{formatTime(s.duration)}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.duration}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default KickCounter;

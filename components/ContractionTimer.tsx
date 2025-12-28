import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Timer, Activity, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Contraction {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
}

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const ContractionTimer: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;
  
  const [isActive, setIsActive] = useState(false);
  const [currentStartTime, setCurrentStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user.id]);

  const fetchHistory = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('contraction_history')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (data?.contraction_history) {
        // Filter to only show today's contractions
        const today = new Date().toDateString();
        const todaysContractions = (data.contraction_history as Contraction[]).filter(c => 
          new Date(c.startTime).toDateString() === today
        );
        setContractions(todaysContractions);
      }
    } catch (e) {
      console.error("Error fetching contraction history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isActive && currentStartTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - currentStartTime) / 1000));
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentStartTime]);

  const startContraction = () => {
    setIsActive(true);
    setCurrentStartTime(Date.now());
    setElapsed(0);
  };

  const stopContraction = async () => {
    if (!currentStartTime) return;
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - currentStartTime) / 1000);
    
    const newContraction: Contraction = {
      id: Date.now().toString(),
      startTime: currentStartTime,
      endTime,
      duration
    };

    const updatedContractions = [newContraction, ...contractions];
    setContractions(updatedContractions);
    setIsActive(false);
    setCurrentStartTime(null);
    setElapsed(0);

    // Save to Supabase
    try {
      // Get existing history first
      const { data } = await supabase
        .from('profiles')
        .select('contraction_history')
        .eq('id', user.id)
        .single();

      const existingHistory = data?.contraction_history || [];
      const fullHistory = [newContraction, ...existingHistory].slice(0, 100); // Keep last 100

      await supabase
        .from('profiles')
        .update({ contraction_history: fullHistory })
        .eq('id', user.id);
    } catch (e) {
      console.error("Error saving contraction:", e);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm(language === 'bn' ? 'আজকের সব রেকর্ড মুছবেন?' : 'Clear all today\'s records?')) return;
    
    setContractions([]);
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('contraction_history')
        .eq('id', user.id)
        .single();

      // Remove only today's contractions from history
      const today = new Date().toDateString();
      const filteredHistory = (data?.contraction_history || []).filter((c: Contraction) => 
        new Date(c.startTime).toDateString() !== today
      );

      await supabase
        .from('profiles')
        .update({ contraction_history: filteredHistory })
        .eq('id', user.id);
    } catch (e) {
      console.error("Error clearing history:", e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatTimeOfDay = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate average duration and frequency
  const getStats = () => {
    if (contractions.length === 0) return { avgDuration: 0, avgFrequency: 0 };
    
    const totalDuration = contractions.reduce((sum, c) => sum + c.duration, 0);
    const avgDuration = Math.round(totalDuration / contractions.length);

    if (contractions.length < 2) return { avgDuration, avgFrequency: 0 };

    // Calculate average time between contractions
    let totalGap = 0;
    for (let i = 0; i < contractions.length - 1; i++) {
      const gap = (contractions[i].startTime - contractions[i + 1].startTime) / 1000 / 60; // in minutes
      totalGap += gap;
    }
    const avgFrequency = Math.round(totalGap / (contractions.length - 1));

    return { avgDuration, avgFrequency };
  };

  const stats = getStats();

  // Check if contractions indicate labor
  const getLaborStatus = () => {
    if (contractions.length < 3) return 'tracking';
    if (stats.avgDuration >= 45 && stats.avgFrequency <= 5) return 'active';
    if (stats.avgDuration >= 30 && stats.avgFrequency <= 10) return 'early';
    return 'tracking';
  };

  const laborStatus = getLaborStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-pink-100 px-4 py-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-800 tracking-tight">
              {language === 'bn' ? 'কন্ট্রাকশন টাইমার' : 'Contraction Timer'}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {language === 'bn' ? 'প্রসব পূর্ববর্তী সংকোচন ট্র্যাক করুন' : 'Track your labor contractions'}
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
            <Timer size={18} className="text-white" />
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Status Card */}
        {contractions.length >= 3 && (
          <div className={`rounded-2xl p-4 border-2 ${
            laborStatus === 'active' 
              ? 'bg-red-50 border-red-200' 
              : laborStatus === 'early'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              {laborStatus === 'active' ? (
                <AlertTriangle size={24} className="text-red-500" />
              ) : laborStatus === 'early' ? (
                <Clock size={24} className="text-amber-500" />
              ) : (
                <CheckCircle2 size={24} className="text-green-500" />
              )}
              <div>
                <h3 className={`font-bold ${
                  laborStatus === 'active' ? 'text-red-800' : laborStatus === 'early' ? 'text-amber-800' : 'text-green-800'
                }`}>
                  {laborStatus === 'active' 
                    ? (language === 'bn' ? '🚨 সক্রিয় প্রসব - হাসপাতালে যান!' : '🚨 Active Labor - Go to Hospital!')
                    : laborStatus === 'early'
                    ? (language === 'bn' ? 'প্রাথমিক প্রসব পর্যায়' : 'Early Labor Phase')
                    : (language === 'bn' ? 'ট্র্যাকিং চলছে' : 'Tracking in Progress')}
                </h3>
                <p className={`text-xs ${
                  laborStatus === 'active' ? 'text-red-600' : laborStatus === 'early' ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {laborStatus === 'active'
                    ? (language === 'bn' ? 'সংকোচন ৫ মিনিট বা কম পরপর, ৪৫+ সেকেন্ড স্থায়ী' : 'Contractions 5 min or less apart, lasting 45+ sec')
                    : laborStatus === 'early'
                    ? (language === 'bn' ? 'সংকোচন ১০ মিনিটের কম পরপর আসছে' : 'Contractions coming less than 10 min apart')
                    : (language === 'bn' ? 'আরও ডেটা সংগ্রহ করা হচ্ছে' : 'Collecting more data')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timer Circle */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            {/* Outer Ring Animation */}
            {isActive && (
              <div className="absolute inset-0 w-56 h-56 rounded-full border-4 border-rose-300 animate-ping opacity-20" />
            )}
            
            {/* Main Circle */}
            <div className={`w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
              isActive 
                ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-2xl shadow-rose-300 scale-105' 
                : 'bg-white border-4 border-rose-100 shadow-xl'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isActive ? 'text-rose-100' : 'text-rose-400'}`}>
                {isActive 
                  ? (language === 'bn' ? 'সংকোচন চলছে' : 'Contraction Active') 
                  : (language === 'bn' ? 'প্রস্তুত' : 'Ready')}
              </p>
              <div className={`text-5xl font-black tabular-nums ${isActive ? 'text-white' : 'text-gray-800'}`}>
                {formatTime(elapsed)}
              </div>
              <p className={`text-sm mt-2 font-medium ${isActive ? 'text-rose-100' : 'text-gray-400'}`}>
                {language === 'bn' ? 'সেকেন্ড' : 'seconds'}
              </p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 mt-8">
            {isActive ? (
              <button
                onClick={stopContraction}
                className="w-20 h-20 bg-white border-4 border-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-rose-200 active:scale-90 transition-all"
              >
                <Pause size={32} className="text-rose-500" />
              </button>
            ) : (
              <button
                onClick={startContraction}
                className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl shadow-rose-300 active:scale-90 transition-all text-white"
              >
                <Play size={32} className="ml-1" />
              </button>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4 max-w-xs">
            {language === 'bn' 
              ? 'সংকোচন শুরু হলে Play চাপুন, শেষ হলে Pause চাপুন'
              : 'Press Play when contraction starts, Pause when it ends'}
          </p>
        </div>

        {/* Stats Cards */}
        {contractions.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-gray-800">{contractions.length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                {language === 'bn' ? 'মোট' : 'Total'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-rose-600">{formatTime(stats.avgDuration)}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                {language === 'bn' ? 'গড় সময়' : 'Avg Length'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-pink-600">{stats.avgFrequency || '--'}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                {language === 'bn' ? 'মিনিট পরপর' : 'Min Apart'}
              </p>
            </div>
          </div>
        )}

        {/* History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} />
              {language === 'bn' ? 'আজকের রেকর্ড' : "Today's Record"}
            </h3>
            {contractions.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline"
              >
                <Trash2 size={12} />
                {language === 'bn' ? 'মুছুন' : 'Clear'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="animate-spin text-rose-400" />
            </div>
          ) : contractions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <Timer size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-sm font-bold text-gray-400">
                {language === 'bn' ? 'এখনও কোন রেকর্ড নেই' : 'No contractions recorded yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contractions.map((c, i) => {
                const gap = i < contractions.length - 1 
                  ? Math.round((c.startTime - contractions[i + 1].startTime) / 1000 / 60)
                  : null;
                  
                return (
                  <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center font-black text-rose-600">
                      {contractions.length - i}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{formatTime(c.duration)}</span>
                        <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                          {formatTimeOfDay(c.startTime)}
                        </span>
                      </div>
                      {gap !== null && (
                        <p className="text-xs text-gray-400 mt-1">
                          {language === 'bn' ? `${gap} মিনিট পরে` : `${gap} min after previous`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100">
          <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            {language === 'bn' ? 'কখন হাসপাতালে যাবেন' : 'When to Go to Hospital'}
          </h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            {language === 'bn'
              ? '5-1-1 নিয়ম মনে রাখুন: সংকোচন যখন প্রতি ৫ মিনিটে আসে, প্রতিটি ১ মিনিট বা তার বেশি স্থায়ী হয়, এবং এটি ১ ঘণ্টা বা তার বেশি সময় ধরে চলে - তখন হাসপাতালে যাওয়ার সময়।'
              : 'Remember the 5-1-1 rule: When contractions come every 5 minutes, last at least 1 minute each, and this pattern continues for at least 1 hour - it\'s time to go to the hospital.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContractionTimer;

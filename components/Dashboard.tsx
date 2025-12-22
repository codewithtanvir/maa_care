
import React, { useState, useEffect } from 'react';
import { UserProfile, View, LogEntry, Appointment } from '../types';
import { getDashboardInsight } from '../services/geminiService';
import { RefreshCw, Info, Briefcase, Footprints, Brain, MapPin, Clock, Stethoscope, ChevronRight, Mic, Baby, Heart } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<Props> = ({ user, onNavigate }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const t = translations[user?.language || 'en'] || translations.en;

  const progress = ((user?.currentWeek || 1) / 40) * 100;
  const fruitReference = t.fruitReference[(user?.currentWeek || 1) - 1] || t.fruitReference[39];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return user.language === 'bn' ? 'শুভ সকাল' : 'Good Morning';
    if (hour < 17) return user.language === 'bn' ? 'শুভ দুপুর' : 'Good Afternoon';
    return user.language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good Evening';
  };

  const fetchInsight = async () => {
    if (!user?.currentWeek || !user?.id) return;
    setLoadingInsight(true);
    try {
      const { data: logs, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const res = await getDashboardInsight(user, logs || []);
      setInsight(res || null);
    } catch (e) {
      console.error("Insight error:", e);
      setInsight((user?.language || 'en') === 'bn' ? "আজ পুষ্টিকর খাবার খান!" : "Focus on nutrition today!");
    } finally {
      setLoadingInsight(false);
    }
  };

  const fetchAppointments = async () => {
    if (!user?.id) return;
    setLoadingApps(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const filtered = data
          .filter(app => new Date(app.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setAppointments(filtered.slice(0, 2));
      }
    } catch (e) {
      console.error("Failed to fetch appointments", e);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (user?.currentWeek) {
      fetchInsight();
    }
    
    if (user?.id) {
      fetchAppointments();
    }
  }, [user?.currentWeek, user?.id]);

  if (!user) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 pb-12 space-y-8 bg-slate-50/50">
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-pink-100 border-2 border-white flex-shrink-0">
            <img src="/mask-icon.svg" alt="Maa Care Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-pink-500 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">{getGreeting()}</p>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight truncate">
              {user.name || 'Mama'}<span className="text-pink-500">.</span>
            </h1>
          </div>
        </div>
        <button 
          onClick={() => onNavigate(View.PROFILE)}
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-pink-100 active:scale-90 transition-all relative group flex-shrink-0"
        >
          <div className="relative z-10">
            <Heart className="text-pink-500 group-hover:fill-pink-500 transition-all" fill="#fce7f3" size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          </div>
          <div className="absolute inset-0 bg-pink-50 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-300" />
        </button>
      </header>

      {/* Main Progress Card */}
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-pink-50/50 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100 rounded-full -mr-32 -mt-32 opacity-40 blur-3xl group-hover:bg-pink-200 transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full -ml-16 -mb-16 opacity-30 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-pink-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-100">
                  {t.week} {user.currentWeek || 1}
                </span>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                  {Math.floor((user.currentWeek || 1) / 4)} {user.language === 'bn' ? 'মাস' : 'Months'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <h2 className="text-6xl font-black text-gray-900 tabular-nums tracking-tighter">{40 - (user.currentWeek || 1)}</h2>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{t.weeksToGo}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl flex items-center justify-center text-pink-500 border border-pink-100 shadow-inner rotate-3 group-hover:rotate-6 transition-transform duration-500">
                 <Baby size={40} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{fruitReference}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] px-1">
              <span>{user.language === 'bn' ? 'গর্ভধারণ' : 'Conception'}</span>
              <span className="text-pink-400">{user.language === 'bn' ? 'প্রসবের তারিখ' : 'Due Date'}</span>
            </div>
            <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(244,114,182,0.4)] relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 skew-x-12 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Insight */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-100 group active:scale-[0.98] transition-all">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/20 transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                <Brain size={20} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                {t.dailyInsight}
              </h3>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); fetchInsight(); }} 
              disabled={loadingInsight} 
              className={`p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90 ${loadingInsight ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {loadingInsight ? (
            <div className="space-y-3">
              <div className="h-3 bg-white/20 rounded-full w-full animate-pulse" />
              <div className="h-3 bg-white/20 rounded-full w-4/5 animate-pulse" />
            </div>
          ) : (
            <p className="text-indigo-50 text-lg leading-relaxed font-medium italic drop-shadow-sm">
              "{insight}"
            </p>
          )}
        </div>
      </section>

      {/* Appointments Quick View */}
      {appointments.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.appointments}</h3>
            <button onClick={() => onNavigate(View.APPOINTMENTS)} className="text-pink-500 text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {appointments.map(app => (
              <div key={app.id} onClick={() => onNavigate(View.APPOINTMENTS)} className="bg-white p-5 rounded-[2.5rem] border border-pink-50 shadow-sm flex items-center gap-5 group active:scale-[0.98] transition-all cursor-pointer hover:border-pink-200">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-600 shrink-0 border border-indigo-100/50 group-hover:bg-indigo-100 transition-colors">
                  <span className="text-[10px] font-black uppercase">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-xl font-black leading-none">{new Date(app.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-base truncate mb-1">{app.title}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                      <Clock size={12} className="text-indigo-400" /> {app.time}
                    </span>
                    {app.location && (
                      <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider truncate">
                        <MapPin size={12} className="text-rose-400" /> {app.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-pink-500 group-hover:bg-pink-50 transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Essential Features Grid */}
      <section className="space-y-4 pb-8">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{t.essentials}</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate(View.SYMPTOM_CHECKER)} 
            className="col-span-2 p-8 bg-white rounded-[3rem] border border-indigo-100 shadow-sm active:scale-95 transition-all text-left relative overflow-hidden group"
          >
            <div className="absolute right-0 bottom-0 p-4 text-indigo-50 group-hover:text-indigo-100 transition-colors duration-500">
              <Stethoscope size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                <Brain size={28} />
              </div>
              <p className="font-black text-gray-900 text-xl mb-1">{t.symptomChecker}</p>
              <p className="text-xs text-gray-400 font-medium">{user.language === 'bn' ? 'এআই চালিত স্বাস্থ্য পরামর্শ' : 'AI-Powered Health Analysis'}</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate(View.FOOD_SAFETY)} 
            className="p-6 bg-white rounded-[2.5rem] border border-teal-100 shadow-sm active:scale-95 transition-all text-left relative overflow-hidden group"
          >
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-teal-100 group-hover:rotate-12 transition-transform">
              <Info size={24} />
            </div>
            <p className="font-black text-gray-900 text-sm mb-1">{t.safeFoods}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dietary Guide</p>
          </button>

          <button 
            onClick={() => onNavigate(View.KICK_COUNTER)} 
            className="p-6 bg-white rounded-[2.5rem] border border-amber-100 shadow-sm active:scale-95 transition-all text-left relative overflow-hidden group"
          >
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-100 group-hover:animate-bounce transition-all">
              <Footprints size={24} />
            </div>
            <p className="font-black text-gray-900 text-sm mb-1">{t.kickCounter}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Safety Check</p>
          </button>

          <button 
            onClick={() => onNavigate(View.HOSPITAL_BAG)} 
            className="col-span-2 p-6 bg-white rounded-[2.5rem] border border-blue-100 shadow-sm active:scale-95 transition-all text-left relative overflow-hidden group flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-blue-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase size={32} />
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg mb-1">{t.hospitalBag}</p>
              <p className="text-xs text-gray-400 font-medium">Essential Checklist</p>
            </div>
            <div className="ml-auto w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <ChevronRight size={20} />
            </div>
          </button>

          <button 
            onClick={() => onNavigate(View.VOICE)} 
            className="col-span-2 p-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-[3rem] shadow-xl shadow-rose-100 active:scale-95 transition-all text-left relative overflow-hidden group flex items-center gap-6"
          >
            <div className="absolute right-0 top-0 p-4 text-white/10 group-hover:text-white/20 transition-colors duration-700">
              <Mic size={140} strokeWidth={1} />
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center text-white shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500">
              <Mic size={32} />
            </div>
            <div className="relative z-10">
              <p className="font-black text-white text-xl mb-1">{t.voiceCompanion}</p>
              <p className="text-xs text-rose-100 font-medium">{user.language === 'bn' ? 'এআই ভয়েস সাপোর্ট' : 'AI Voice Support'}</p>
            </div>
            <div className="ml-auto w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white relative z-10 group-hover:bg-white group-hover:text-rose-500 transition-all">
              <ChevronRight size={24} />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { UserProfile, View, Appointment } from '../types';
import { getDashboardInsight } from '../services/geminiService';
import { RefreshCw, Info, Briefcase, Footprints, Brain, MapPin, Clock, ChevronRight, Mic, Baby, Heart, Bell, Apple, ShieldAlert } from 'lucide-react';
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
  const [randomTip, setRandomTip] = useState<string>('');
  const t = translations[user?.language || 'en'] || translations.en;

  const progress = ((user?.currentWeek || 1) / 40) * 100;
  const fruitReference = t.fruitReference[(user?.currentWeek || 1) - 1] || t.fruitReference[39];

  const getTrimester = () => {
    const week = user?.currentWeek || 1;
    if (week <= 12) return t.trimester1;
    if (week <= 26) return t.trimester2;
    return t.trimester3;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return user.language === 'bn' ? 'শুভ সকাল' : 'Good Morning';
    if (hour < 17) return user.language === 'bn' ? 'শুভ দুপুর' : 'Good Afternoon';
    return user.language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good Evening';
  };

  const fetchInsight = async (force = false) => {
    if (!user?.currentWeek || !user?.id) return;
    
    // Check cache
    const cacheKey = `dashboard_insight_${user.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (!force && cached) {
      try {
        const { text, timestamp } = JSON.parse(cached);
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - timestamp < oneHour) {
          setInsight(text);
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached insight", e);
      }
    }

    setLoadingInsight(true);
    setInsight(null); 
    try {
      const { data: logs, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const res = await getDashboardInsight(user, logs || []);
      if (res) {
        setInsight(res);
        localStorage.setItem(cacheKey, JSON.stringify({ text: res, timestamp: Date.now() }));
      }
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
    setAppointments([]); // Clear previous appointments
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

    // Pick a random tip
    const tips = t.tips || [];
    if (tips.length > 0) {
      setRandomTip(tips[Math.floor(Math.random() * tips.length)]);
    }
  }, [user?.currentWeek, user?.id, user?.language]);

  return (
    <div className="pb-24 bg-slate-50/50 min-h-screen">
      <div className="p-6 space-y-8">
        <header className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xl shadow-pink-100 border-2 border-white flex-shrink-0 animate-in zoom-in duration-700">
              <img src="/mask-icon.svg" alt="Maa Care Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 animate-in slide-in-from-left duration-700">
              <p className="text-pink-500 text-xs font-black uppercase tracking-[0.2em] mb-0.5 opacity-80">{getGreeting()}</p>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight truncate">
                {user.name || 'Mama'}<span className="text-pink-500">.</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate(View.NOTIFICATIONS)}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-pink-50 border border-pink-50 active:scale-90 transition-all relative group flex-shrink-0 animate-in slide-in-from-right duration-700"
            >
              <Bell className="text-gray-400 group-hover:text-pink-500 transition-all" size={24} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-white" />
            </button>
            <button 
              onClick={() => onNavigate(View.PROFILE)}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-pink-50 border border-pink-50 active:scale-90 transition-all relative group flex-shrink-0 animate-in slide-in-from-right duration-700"
            >
              <Heart className="text-pink-500 group-hover:fill-pink-500 transition-all" fill="#fce7f3" size={24} />
            </button>
          </div>
        </header>

        {/* Main Progress Card - Premium Redesign */}
        <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-pink-100/50 border border-white group animate-in fade-in slide-in-from-bottom duration-1000">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full -mr-32 -mt-32 opacity-40 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full -ml-16 -mb-16 opacity-20 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-pink-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-200">
                    {t.week} {user.currentWeek || 1}
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
                    {getTrimester()}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pt-2">
                  <h2 className="text-5xl font-black text-gray-900 tabular-nums tracking-tighter leading-none">{40 - (user.currentWeek || 1)}</h2>
                  <div className="flex flex-col">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">{t.weeksToGo}</p>
                    <p className="text-pink-600 text-xs font-black uppercase tracking-widest">{user.language === 'bn' ? 'বাকি আছে' : 'Remaining'}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center group/baby">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-100 rounded-[2rem] flex items-center justify-center text-pink-500 border border-white shadow-xl group-hover/baby:scale-110 transition-transform duration-500">
                   <Baby size={32} strokeWidth={1.5} className="drop-shadow-sm" />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-0.5">{user.language === 'bn' ? 'আপনার শিশু' : 'Your Baby'}</p>
                  <span className="text-xs font-black text-pink-600 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">{fruitReference}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{user.language === 'bn' ? 'গর্ভাবস্থা অগ্রগতি' : 'Pregnancy Progress'}</span>
                <span className="text-sm font-black text-pink-600 tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 via-rose-500 to-pink-600 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-white/30 blur-[2px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Updates - Vertical Stack - Premium Glassmorphism */}
      <div className="px-6 pb-6 space-y-3">
        {/* Daily Insight Card */}
        <section className="w-full bg-indigo-600 rounded-[1.5rem] p-5 text-white relative overflow-hidden shadow-xl shadow-indigo-100 group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-xl rounded-lg flex items-center justify-center shadow-inner border border-white/20">
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-100">
                  {t.dailyInsight}
                </h3>
                <p className="text-xs font-black uppercase tracking-widest text-white">{user.language === 'bn' ? 'এআই বিশ্লেষণ' : 'AI Analysis'}</p>
              </div>
            </div>
            <button 
              onClick={() => fetchInsight(true)}
              disabled={loadingInsight}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 border border-white/10"
            >
              <RefreshCw size={14} className={loadingInsight ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {loadingInsight ? (
            <div className="space-y-2">
              <div className="h-1.5 bg-white/20 rounded-full w-full animate-pulse" />
              <div className="h-1.5 bg-white/20 rounded-full w-5/6 animate-pulse" />
            </div>
          ) : (
            <p className="text-indigo-50 text-sm font-bold leading-relaxed tracking-tight">
              {insight || (user.language === 'bn' ? "আপনার স্বাস্থ্য তথ্য বিশ্লেষণ করা হচ্ছে..." : "Analyzing your health data...")}
            </p>
          )}
        </section>

        {/* Quick Tip Card */}
        <section className="w-full bg-rose-500 rounded-[1.5rem] p-5 text-white relative overflow-hidden shadow-xl shadow-rose-100 group">
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-xl rounded-lg flex items-center justify-center shadow-inner border border-white/20">
              <Info size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-rose-100">
                {user.language === 'bn' ? 'দ্রুত টিপস' : 'Quick Tip'}
              </h3>
              <p className="text-xs font-black uppercase tracking-widest text-white">{user.language === 'bn' ? 'আজকের পরামর্শ' : 'Today\'s Advice'}</p>
            </div>
          </div>
          <p className="text-rose-50 text-sm font-bold leading-relaxed tracking-tight">
            {randomTip || (user.language === 'bn' ? 'পর্যাপ্ত বিশ্রাম নিন।' : 'Get plenty of rest.')}
          </p>
        </section>
      </div>

      <div className="px-6 space-y-10">
        {/* Quick Actions Grid - Premium Tiles */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1 h-4 bg-pink-500 rounded-full" />
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">{t.essentials}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate(View.SYMPTOM_CHECKER)} 
              className="group relative bg-white p-5 rounded-[2rem] border border-indigo-50 shadow-sm hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                  <Brain size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base tracking-tight">{t.symptomChecker}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'এআই বিশ্লেষণ' : 'AI Analysis'}</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => onNavigate(View.FOOD_SAFETY)} 
              className="group relative bg-white p-5 rounded-[2rem] border border-teal-50 shadow-sm hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/50 transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-teal-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200 group-hover:rotate-6 transition-transform">
                  <Info size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base tracking-tight">{t.safeFoods}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'খাবার গাইড' : 'Food Guide'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.KICK_COUNTER)} 
              className="group relative bg-white p-5 rounded-[2rem] border border-amber-50 shadow-sm hover:border-amber-200 hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:rotate-6 transition-transform">
                  <Footprints size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base tracking-tight">{t.kickCounter}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'শিশুর নড়াচড়া' : 'Baby Kicks'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.HOSPITAL_BAG)} 
              className="group relative bg-white p-5 rounded-[2rem] border border-blue-50 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                  <Briefcase size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base tracking-tight">{t.hospitalBag}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'চেকলিস্ট' : 'Checklist'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.MOOD_TRACKER)} 
              className="group relative bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-pink-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200 group-hover:rotate-6 transition-transform">
                  <Heart size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base tracking-tight">{t.moodTracker}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'মন মেজাজ' : 'Mood'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.NUTRITION)} 
              className="group relative bg-white p-5 rounded-[2rem] border border-green-50 shadow-sm hover:border-green-200 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200 group-hover:rotate-6 transition-transform">
                  <Apple size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base tracking-tight">{t.nutrition}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'পুষ্টি ও যত্ন' : 'Nutrition'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.EMERGENCY)} 
              className="group relative bg-white p-5 rounded-[2rem] border border-red-50 shadow-sm hover:border-red-200 hover:shadow-xl hover:shadow-red-100/50 transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:rotate-6 transition-transform">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-base tracking-tight">{t.emergency}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'জরুরি' : 'Emergency'}</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Voice Support - Premium Glowing Banner */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <button 
            onClick={() => onNavigate(View.VOICE)} 
            className="relative w-full p-5 bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center gap-5 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center text-white shadow-inner border border-white/20 shrink-0">
              <Mic size={28} className="animate-pulse" />
            </div>
            <div className="text-left flex-1">
              <p className="font-black text-white text-lg tracking-tight">{t.voiceCompanion}</p>
              <p className="text-xs text-rose-100 font-bold uppercase tracking-widest opacity-90 mt-0.5">{user.language === 'bn' ? 'এআই ভয়েস সাপোর্ট' : 'AI Voice Support'}</p>
            </div>
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        </div>

        {/* Appointments - Premium List */}
        {appointments.length > 0 && (
          <section className="space-y-6 pb-12">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">{t.appointments}</h3>
              </div>
              <button 
                onClick={() => onNavigate(View.APPOINTMENTS)} 
                className="text-pink-500 text-xs font-black uppercase tracking-[0.2em] hover:underline"
              >
                {user.language === 'bn' ? 'সব দেখুন' : 'View All'}
              </button>
            </div>
            <div className="space-y-4">
              {appointments.map(app => (
                <div 
                  key={app.id} 
                  onClick={() => onNavigate(View.APPOINTMENTS)} 
                  className="group bg-white p-5 rounded-[2.5rem] border border-pink-50 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all cursor-pointer hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100/50"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex flex-col items-center justify-center text-indigo-600 shrink-0 border border-indigo-100/50 shadow-inner group-hover:scale-110 transition-transform">
                    <span className="text-xs font-black uppercase tracking-tighter">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xl font-black leading-none">{new Date(app.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-base tracking-tight truncate">{app.title}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={12} className="text-indigo-400" /> {app.time}
                      </p>
                      {app.location && (
                        <p className="text-xs text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin size={12} className="text-rose-400" /> {app.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-pink-50 group-hover:text-pink-500 transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

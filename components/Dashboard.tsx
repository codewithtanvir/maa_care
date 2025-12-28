
import React, { useState, useEffect } from 'react';
import { UserProfile, View, Appointment } from '../types';
import { getDashboardInsight } from '../services/geminiService';
import { RefreshCw, Info, Briefcase, Footprints, Brain, MapPin, Clock, ChevronRight, Mic, Baby, Heart, Bell, Apple, ShieldAlert, Sparkles, User } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FDFCFD] pb-24">
      {/* Header - More Compact & Premium */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-pink-50/50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200 rotate-3">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Maa CareAI</h1>
            <p className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.2em] mt-1">Premium Care</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate(View.NOTIFICATIONS)}
            className="w-10 h-10 rounded-full bg-white border border-pink-50 shadow-sm flex items-center justify-center text-gray-400 hover:text-pink-500 transition-colors relative"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white" />
          </button>
          <button 
            onClick={() => onNavigate(View.PROFILE)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-white shadow-sm flex items-center justify-center text-pink-500 hover:scale-105 transition-transform active:scale-95"
          >
            <User size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 pt-6 space-y-8">

        {/* Pregnancy Progress - Redesigned for Compactness */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-100 to-rose-100 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative bg-white rounded-[2.5rem] p-6 border border-pink-50 shadow-xl shadow-pink-100/20 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-pink-50 rounded-full opacity-50 blur-3xl" />
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-1">{t.pregnancyProgress}</p>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                  {user.language === 'bn' ? `সপ্তাহ ${user.currentWeek}` : `Week ${user.currentWeek}`}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{t.dueDate}</p>
                <p className="text-sm font-black text-gray-700">
                  {user.dueDate ? new Date(user.dueDate).toLocaleDateString(user.language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}
                </p>
              </div>
            </div>

            <div className="relative h-3 bg-gray-50 rounded-full overflow-hidden mb-4 border border-gray-100/50">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 via-rose-500 to-pink-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {user.language === 'bn' ? `${Math.round(progress)}% সম্পন্ন` : `${Math.round(progress)}% Complete`}
                </p>
              </div>
              <p className="text-xs font-black text-pink-600 bg-pink-50 px-3 py-1 rounded-full uppercase tracking-widest">
                {user.language === 'bn' ? `${40 - (user.currentWeek || 1)} সপ্তাহ বাকি` : `${40 - (user.currentWeek || 1)} Weeks Left`}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* AI Updates - More Compact & Integrated */}
      <div className="px-6 pb-6 grid grid-cols-1 gap-4">
        {/* Daily Insight Card */}
        <section className="bg-indigo-600 rounded-[2rem] p-5 text-white relative overflow-hidden shadow-lg shadow-indigo-100 group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-inner border border-white/20">
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100">
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
            <p className="text-indigo-50 text-sm font-medium leading-relaxed tracking-tight">
              {insight || (user.language === 'bn' ? "আপনার স্বাস্থ্য তথ্য বিশ্লেষণ করা হচ্ছে..." : "Analyzing your health data...")}
            </p>
          )}
        </section>

        {/* Quick Tip Card */}
        <section className="bg-rose-500 rounded-[2rem] p-5 text-white relative overflow-hidden shadow-lg shadow-rose-100 group">
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-inner border border-white/20">
              <Info size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-100">
                {user.language === 'bn' ? 'দ্রুত টিপস' : 'Quick Tip'}
              </h3>
              <p className="text-xs font-black uppercase tracking-widest text-white">{user.language === 'bn' ? 'আজকের পরামর্শ' : 'Today\'s Advice'}</p>
            </div>
          </div>
          <p className="text-rose-50 text-sm font-medium leading-relaxed tracking-tight">
            {randomTip || (user.language === 'bn' ? 'পর্যাপ্ত বিশ্রাম নিন।' : 'Get plenty of rest.')}
          </p>
        </section>
      </div>

      <div className="px-6 space-y-8">
        {/* Quick Actions Grid - More Compact & Modern */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1 h-4 bg-pink-500 rounded-full" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{t.essentials}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate(View.SYMPTOM_CHECKER)} 
              className="group relative bg-white p-4 rounded-[1.5rem] border border-indigo-50 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all active:scale-95 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform">
                  <Brain size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{t.symptomChecker}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'এআই বিশ্লেষণ' : 'AI Analysis'}</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => onNavigate(View.FOOD_SAFETY)} 
              className="group relative bg-white p-4 rounded-[1.5rem] border border-teal-50 shadow-sm hover:border-teal-200 hover:shadow-md transition-all active:scale-95 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-100 group-hover:rotate-6 transition-transform">
                  <Info size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{t.safeFoods}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'খাবার গাইড' : 'Food Guide'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.KICK_COUNTER)} 
              className="group relative bg-white p-4 rounded-[1.5rem] border border-amber-50 shadow-sm hover:border-amber-200 hover:shadow-md transition-all active:scale-95 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-100 group-hover:rotate-6 transition-transform">
                  <Footprints size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{t.kickCounter}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'শিশুর নড়াচড়া' : 'Baby Kicks'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.HOSPITAL_BAG)} 
              className="group relative bg-white p-4 rounded-[1.5rem] border border-blue-50 shadow-sm hover:border-blue-200 hover:shadow-md transition-all active:scale-95 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:rotate-6 transition-transform">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{t.hospitalBag}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'চেকলিস্ট' : 'Checklist'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.MOOD_TRACKER)} 
              className="group relative bg-white p-4 rounded-[1.5rem] border border-pink-50 shadow-sm hover:border-pink-200 hover:shadow-md transition-all active:scale-95 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-100 group-hover:rotate-6 transition-transform">
                  <Heart size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{t.moodTracker}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'মন মেজাজ' : 'Mood'}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(View.NUTRITION)} 
              className="group relative bg-white p-4 rounded-[1.5rem] border border-green-50 shadow-sm hover:border-green-200 hover:shadow-md transition-all active:scale-95 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100 group-hover:rotate-6 transition-transform">
                  <Apple size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{t.nutrition}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'পুষ্টি ও যত্ন' : 'Nutrition'}</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Voice Support - Compact Premium Banner */}
        <button 
          onClick={() => onNavigate(View.VOICE)} 
          className="relative w-full p-4 bg-gradient-to-br from-rose-500 to-pink-600 rounded-[1.5rem] shadow-xl active:scale-[0.98] transition-all flex items-center gap-4 overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center text-white shadow-inner border border-white/20 shrink-0">
            <Mic size={24} className="animate-pulse" />
          </div>
          <div className="text-left flex-1">
            <p className="font-black text-white text-base tracking-tight">{t.voiceCompanion}</p>
            <p className="text-[10px] text-rose-100 font-bold uppercase tracking-widest opacity-90 mt-0.5">{user.language === 'bn' ? 'এআই ভয়েস সাপোর্ট' : 'AI Voice Support'}</p>
          </div>
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
            <ChevronRight size={18} />
          </div>
        </button>

        {/* Appointments - More Compact & Premium */}
        {appointments.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{t.appointments}</h3>
              </div>
              <button 
                onClick={() => onNavigate(View.APPOINTMENTS)} 
                className="text-pink-500 text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
              >
                {user.language === 'bn' ? 'সব দেখুন' : 'View All'}
              </button>
            </div>
            <div className="space-y-3">
              {appointments.map(app => (
                <div 
                  key={app.id} 
                  onClick={() => onNavigate(View.APPOINTMENTS)} 
                  className="group bg-white p-4 rounded-[1.5rem] border border-pink-50 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-pink-200 hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex flex-col items-center justify-center text-indigo-600 shrink-0 border border-indigo-100/50 shadow-inner group-hover:scale-105 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-none">{new Date(app.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm tracking-tight truncate">{app.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} className="text-indigo-400" /> {app.time}
                      </p>
                      {app.location && (
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 truncate">
                          <MapPin size={10} className="text-rose-400" /> {app.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-pink-50 group-hover:text-pink-500 transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Emergency - Prominent Banner */}
        <button 
          onClick={() => onNavigate(View.EMERGENCY)} 
          className="w-full p-4 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center gap-4 active:scale-[0.98] transition-all group"
        >
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100 group-hover:animate-bounce">
            <ShieldAlert size={20} />
          </div>
          <div className="text-left flex-1">
            <p className="font-black text-red-900 text-sm tracking-tight">{t.emergency}</p>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-0.5">{user.language === 'bn' ? 'জরুরি সহায়তা' : 'Emergency Help'}</p>
          </div>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-300 group-hover:text-red-500 transition-all shadow-sm">
            <ChevronRight size={16} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { UserProfile, View, Appointment } from '../types';
import { getDashboardInsight } from '../services/geminiService';
import { RefreshCw, Briefcase, Footprints, Brain, MapPin, Clock, ChevronRight, Mic, Baby, Heart, Bell, Apple, ShieldAlert, Sparkles, User, Timer, Calendar, Activity, MessageCircle, Salad, Stethoscope, Smile, Frown, Meh, X, Zap, CloudRain } from 'lucide-react';
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
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSaving, setMoodSaving] = useState(false);
  const [showMoodFeedback, setShowMoodFeedback] = useState(false);
  const t = translations[user?.language || 'en'] || translations.en;

  const moodSummaries: Record<string, { en: string; bn: string; emoji: string }> = {
    happy: { 
      en: "Wonderful! Your positive energy is great for you and your baby. Keep spreading that joy! 💕", 
      bn: "চমৎকার! আপনার ইতিবাচক শক্তি আপনার এবং আপনার শিশুর জন্য দারুণ। এই আনন্দ ধরে রাখুন! 💕",
      emoji: "🌟"
    },
    excited: { 
      en: "That excitement is beautiful! Channel it into preparing for your little one. You're doing amazing! ✨", 
      bn: "এই উত্তেজনা সুন্দর! আপনার ছোট্ট সোনার জন্য প্রস্তুতিতে এটি কাজে লাগান। আপনি দারুণ করছেন! ✨",
      emoji: "🎉"
    },
    calm: { 
      en: "Peace and calm are precious. Your baby feels this serenity too. Take a deep breath and enjoy this moment. 🌸", 
      bn: "শান্তি অমূল্য। আপনার শিশুও এই প্রশান্তি অনুভব করে। গভীর শ্বাস নিন এবং এই মুহূর্ত উপভোগ করুন। 🌸",
      emoji: "😌"
    },
    tired: { 
      en: "It's okay to feel tired, mama. Your body is doing incredible work. Rest when you can, you deserve it. 💜", 
      bn: "ক্লান্ত লাগাটা স্বাভাবিক, মা। আপনার শরীর অবিশ্বাস্য কাজ করছে। যখন পারেন বিশ্রাম নিন, আপনি এটি প্রাপ্য। 💜",
      emoji: "🫂"
    },
    anxious: { 
      en: "Feeling anxious is normal during pregnancy. Take slow breaths. Remember, you're stronger than you know. We're here for you. 💗", 
      bn: "গর্ভাবস্থায় উদ্বিগ্ন হওয়া স্বাভাবিক। ধীরে শ্বাস নিন। মনে রাখবেন, আপনি যতটা ভাবেন তার চেয়ে শক্তিশালী। আমরা আপনার পাশে আছি। 💗",
      emoji: "🤗"
    }
  };

  const moods = [
    { id: 'happy', icon: <Smile size={28} />, label: user.language === 'bn' ? 'খুশি' : 'Happy', color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50' },
    { id: 'excited', icon: <Zap size={28} />, label: user.language === 'bn' ? 'উত্তেজিত' : 'Excited', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
    { id: 'calm', icon: <Meh size={28} />, label: user.language === 'bn' ? 'শান্ত' : 'Calm', color: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50' },
    { id: 'tired', icon: <CloudRain size={28} />, label: user.language === 'bn' ? 'ক্লান্ত' : 'Tired', color: 'from-slate-400 to-gray-500', bg: 'bg-slate-50' },
    { id: 'anxious', icon: <Frown size={28} />, label: user.language === 'bn' ? 'উদ্বিগ্ন' : 'Anxious', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50' },
  ];

  const progress = ((user?.currentWeek || 1) / 40) * 100;
  const daysLeft = (40 - (user?.currentWeek || 1)) * 7;

  const getTrimester = () => {
    const week = user?.currentWeek || 1;
    if (week <= 12) return { num: 1, label: t.trimester1, color: 'from-emerald-400 to-teal-500' };
    if (week <= 26) return { num: 2, label: t.trimester2, color: 'from-amber-400 to-orange-500' };
    return { num: 3, label: t.trimester3, color: 'from-rose-400 to-pink-500' };
  };

  const trimester = getTrimester();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return user.language === 'bn' ? 'শুভ সকাল' : 'Good Morning';
    if (hour < 17) return user.language === 'bn' ? 'শুভ দুপুর' : 'Good Afternoon';
    return user.language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good Evening';
  };

  const fetchInsight = async (force = false) => {
    if (!user?.currentWeek || !user?.id) return;
    
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
      if (res && res.trim()) {
        setInsight(res);
        localStorage.setItem(cacheKey, JSON.stringify({ text: res, timestamp: Date.now() }));
      } else {
        setInsight((user?.language || 'en') === 'bn' ? "আজ পুষ্টিকর খাবার খান এবং পর্যাপ্ত বিশ্রাম নিন!" : "Focus on nutrition and get plenty of rest today!");
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
    setAppointments([]);
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
      checkMoodPopup();
    }

    const tips = t.tips || [];
    if (tips.length > 0) {
      setRandomTip(tips[Math.floor(Math.random() * tips.length)]);
    }
  }, [user?.currentWeek, user?.id, user?.language]);

  const checkMoodPopup = () => {
    // Show mood popup only on initial app open (per session), not when navigating back
    const sessionKey = `mood_popup_session_${user.id}`;
    const hasShownThisSession = sessionStorage.getItem(sessionKey);
    if (!hasShownThisSession) {
      sessionStorage.setItem(sessionKey, 'true');
      setTimeout(() => setShowMoodPopup(true), 1500);
    }
  };

  const saveMood = async (moodId: string) => {
    setSelectedMood(moodId);
    setMoodSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('health_logs').insert({
        user_id: user.id,
        date: today,
        mood: moodId,
        symptoms: [],
        notes: '',
        created_at: new Date().toISOString()
      });
      localStorage.setItem(`mood_popup_${user.id}`, new Date().toDateString());
      setShowMoodFeedback(true);
    } catch (e) {
      console.error('Failed to save mood', e);
    } finally {
      setMoodSaving(false);
    }
  };

  const closeMoodPopup = () => {
    setShowMoodPopup(false);
    setShowMoodFeedback(false);
    setSelectedMood(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-28">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${trimester.color} opacity-95`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative px-5 pt-12 pb-8">
          {/* Top Bar */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-white/80 text-sm font-medium">{getGreeting()}</p>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {user.name?.split(' ')[0] || 'Mama'} 💕
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate(View.NOTIFICATIONS)}
                className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95 relative border border-white/20"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-white rounded-full border-2 border-current" />
              </button>
              <button 
                onClick={() => onNavigate(View.PROFILE)}
                className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95 border border-white/20"
              >
                <User size={20} />
              </button>
            </div>
          </div>

          {/* Week Progress Card */}
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-5 border border-white/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Baby size={28} className="text-pink-500" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{t.pregnancyProgress}</p>
                  <h2 className="text-3xl font-black text-white">
                    {user.language === 'bn' ? `সপ্তাহ ${user.currentWeek}` : `Week ${user.currentWeek}`}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{trimester.label}</p>
                <p className="text-lg font-black text-white">
                  {user.language === 'bn' ? `${daysLeft} দিন বাকি` : `${daysLeft} days left`}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
              <div 
                className="absolute top-0 h-full w-1 bg-white/50 rounded-full"
                style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-white/70 text-xs font-bold">{Math.round(progress)}%</span>
              <span className="text-white/70 text-xs font-bold">40 {user.language === 'bn' ? 'সপ্তাহ' : 'weeks'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 -mt-2 space-y-5">
        
        {/* AI Insight Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 shrink-0">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-black text-gray-900 text-sm">{t.dailyInsight}</h3>
                  <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">Maa Care AI</p>
                </div>
                <button 
                  onClick={() => fetchInsight(true)}
                  disabled={loadingInsight}
                  className="w-8 h-8 bg-pink-50 hover:bg-pink-100 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={`text-pink-500 ${loadingInsight ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {loadingInsight ? (
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded-full w-4/5 animate-pulse" />
                </div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {insight || (user.language === 'bn' ? "আপনার স্বাস্থ্য তথ্য বিশ্লেষণ করা হচ্ছে..." : "Analyzing your health data...")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Horizontal Scroll */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-black text-gray-900">{t.essentials}</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {/* AI Chat */}
            <button 
              onClick={() => onNavigate(View.CHAT)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 group-active:scale-90 transition-transform">
                <MessageCircle size={26} className="text-white" />
              </div>
              <span className="text-xs font-bold text-gray-700 text-center">{user.language === 'bn' ? 'চ্যাট' : 'Chat'}</span>
            </button>

            {/* Voice */}
            <button 
              onClick={() => onNavigate(View.VOICE)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 group-active:scale-90 transition-transform">
                <Mic size={26} className="text-white" />
              </div>
              <span className="text-xs font-bold text-gray-700 text-center">{user.language === 'bn' ? 'ভয়েস' : 'Voice'}</span>
            </button>

            {/* Symptom Checker */}
            <button 
              onClick={() => onNavigate(View.SYMPTOM_CHECKER)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 group-active:scale-90 transition-transform">
                <Stethoscope size={26} className="text-white" />
              </div>
              <span className="text-xs font-bold text-gray-700 text-center">{user.language === 'bn' ? 'লক্ষণ' : 'Symptoms'}</span>
            </button>

            {/* Health Tracker */}
            <button 
              onClick={() => onNavigate(View.TRACKER)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 group-active:scale-90 transition-transform">
                <Activity size={26} className="text-white" />
              </div>
              <span className="text-xs font-bold text-gray-700 text-center">{user.language === 'bn' ? 'স্বাস্থ্য' : 'Health'}</span>
            </button>

            {/* Kick Counter */}
            <button 
              onClick={() => onNavigate(View.KICK_COUNTER)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 group-active:scale-90 transition-transform">
                <Baby size={26} className="text-white" />
              </div>
              <span className="text-xs font-bold text-gray-700 text-center">{user.language === 'bn' ? 'কিক' : 'Kicks'}</span>
            </button>

            {/* Nutrition */}
            <button 
              onClick={() => onNavigate(View.NUTRITION)}
              className="flex-shrink-0 w-20 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 group-active:scale-90 transition-transform">
                <Salad size={26} className="text-white" />
              </div>
              <span className="text-xs font-bold text-gray-700 text-center">{user.language === 'bn' ? 'পুষ্টি' : 'Nutrition'}</span>
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Mood Tracker */}
          <button 
            onClick={() => onNavigate(View.MOOD_TRACKER)}
            className="bg-white p-4 rounded-2xl shadow-md shadow-slate-100 border border-slate-100 text-left group active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Heart size={22} className="text-pink-500" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">{t.moodTracker}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{user.language === 'bn' ? 'আজ কেমন আছেন?' : 'How are you feeling?'}</p>
          </button>

          {/* Appointments */}
          <button 
            onClick={() => onNavigate(View.APPOINTMENTS)}
            className="bg-white p-4 rounded-2xl shadow-md shadow-slate-100 border border-slate-100 text-left group active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar size={22} className="text-rose-500" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">{t.appointments}</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {appointments.length > 0 
                ? (user.language === 'bn' ? `${appointments.length}টি আসন্ন` : `${appointments.length} upcoming`)
                : (user.language === 'bn' ? 'সময়সূচী করুন' : 'Schedule one')}
            </p>
          </button>

          {/* Food Safety */}
          <button 
            onClick={() => onNavigate(View.FOOD_SAFETY)}
            className="bg-white p-4 rounded-2xl shadow-md shadow-slate-100 border border-slate-100 text-left group active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Apple size={22} className="text-pink-500" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">{t.safeFoods}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{user.language === 'bn' ? 'কি খাবেন?' : 'What to eat?'}</p>
          </button>
        </div>

        {/* Contraction Timer - 3rd Trimester Only */}
        {(user.currentWeek || 1) >= 28 && (
          <button 
            onClick={() => onNavigate(View.CONTRACTION)}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-rose-200 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Timer size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-bold text-white">{user.language === 'bn' ? 'কন্ট্রাকশন টাইমার' : 'Contraction Timer'}</h4>
              <p className="text-xs text-rose-100">{user.language === 'bn' ? 'প্রসব সংকোচন ট্র্যাক করুন' : 'Track your labor contractions'}</p>
            </div>
            <ChevronRight size={20} className="text-white/70" />
          </button>
        )}

        {/* Upcoming Appointment */}
        {appointments.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-md shadow-slate-100 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">{user.language === 'bn' ? 'আসন্ন অ্যাপয়েন্টমেন্ট' : 'Upcoming Appointment'}</h3>
              <button 
                onClick={() => onNavigate(View.APPOINTMENTS)}
                className="text-xs font-bold text-pink-500"
              >
                {user.language === 'bn' ? 'সব দেখুন' : 'View all'}
              </button>
            </div>
            <div 
              onClick={() => onNavigate(View.APPOINTMENTS)}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm border border-pink-100">
                <span className="text-[10px] font-bold text-pink-400 uppercase">
                  {new Date(appointments[0].date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-lg font-black text-pink-600 leading-none">
                  {new Date(appointments[0].date).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">{appointments[0].title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={10} /> {appointments[0].time}
                  </span>
                  {appointments[0].location && (
                    <span className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      <MapPin size={10} /> {appointments[0].location}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        )}

        {/* Quick Tip */}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-pink-200 shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-pink-900 text-sm mb-1">{user.language === 'bn' ? 'আজকের টিপস' : 'Today\'s Tip'}</h4>
              <p className="text-sm text-pink-700 leading-relaxed">
                {randomTip || (user.language === 'bn' ? 'পর্যাপ্ত বিশ্রাম নিন এবং হাইড্রেটেড থাকুন।' : 'Get plenty of rest and stay hydrated.')}
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Button */}
        <button 
          onClick={() => onNavigate(View.EMERGENCY)}
          className="w-full bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-110 transition-transform">
            <ShieldAlert size={22} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-red-900">{t.emergency}</h4>
            <p className="text-xs text-red-500">{user.language === 'bn' ? 'জরুরি সাহায্য প্রয়োজন?' : 'Need urgent help?'}</p>
          </div>
          <ChevronRight size={20} className="text-red-300 group-hover:text-red-500 transition-colors" />
        </button>
      </div>

      {/* Mood Check-in Popup */}
      {showMoodPopup && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            {!showMoodFeedback ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-800">
                      {user.language === 'bn' ? 'আজ কেমন আছেন?' : 'How are you today?'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.language === 'bn' ? 'আপনার মেজাজ ট্র্যাক করুন' : 'Track your daily mood'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      closeMoodPopup();
                      localStorage.setItem(`mood_popup_${user.id}`, new Date().toDateString());
                    }}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => saveMood(mood.id)}
                      disabled={moodSaving}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                        selectedMood === mood.id 
                          ? `bg-gradient-to-br ${mood.color} text-white scale-110 shadow-lg` 
                          : `${mood.bg} text-gray-600 hover:scale-105 active:scale-95`
                      }`}
                    >
                      {mood.icon}
                      <span className="text-[10px] font-bold">{mood.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    closeMoodPopup();
                    localStorage.setItem(`mood_popup_${user.id}`, new Date().toDateString());
                    onNavigate(View.MOOD_TRACKER);
                  }}
                  className="w-full py-3 text-center text-sm font-semibold text-pink-500 hover:bg-pink-50 rounded-xl transition-colors"
                >
                  {user.language === 'bn' ? 'বিস্তারিত লগ করুন →' : 'Log more details →'}
                </button>
              </>
            ) : (
              <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="text-6xl mb-4">
                  {selectedMood && moodSummaries[selectedMood]?.emoji}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {user.language === 'bn' ? 'ধন্যবাদ!' : 'Thank you!'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {selectedMood && (user.language === 'bn' 
                    ? moodSummaries[selectedMood]?.bn 
                    : moodSummaries[selectedMood]?.en)}
                </p>
                <button
                  onClick={closeMoodPopup}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-all"
                >
                  {user.language === 'bn' ? 'চালিয়ে যান' : 'Continue'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

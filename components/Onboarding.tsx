
import React, { useState, useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';
import { 
  ArrowRight, 
  Baby, 
  MessageCircle, 
  Mic, 
  Activity, 
  Sparkles, 
  Check,
  ChevronLeft,
  Calendar as CalendarIcon,
  ChevronRight,
  Loader2,
  Download
} from 'lucide-react';

interface Props {
  onFinish: (profile: UserProfile) => void;
  onInstall?: () => void;
  canInstall?: boolean;
}

const Onboarding: React.FC<Props> = ({ onFinish, onInstall, canInstall }) => {
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<Language>('bn');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [pregnancyNumber, setPregnancyNumber] = useState('1');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('maternity_user');
    if (saved) {
      setIsLoginMode(true);
      try {
        const user = JSON.parse(saved);
        setLoginPhone(user.phoneNumber || '');
        if (user.language) setLanguage(user.language);
      } catch (e) {
        console.error("Failed to parse user in onboarding", e);
      }
    }
  }, []);
  
  const t = translations[language];

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', loginPhone)
        .single();

      if (error || !data) {
        setLoginError(language === 'bn' ? 'কোনো অ্যাকাউন্ট পাওয়া যায়নি' : 'No account found');
        return;
      }

      if (data.pin === loginPin) {
        const userProfile: UserProfile = {
          id: data.id,
          name: data.name,
          phoneNumber: data.phone_number,
          pin: data.pin,
          dueDate: data.due_date,
          currentWeek: data.current_week,
          language: data.language as Language,
          onboarded: data.onboarded,
          age: data.age,
          weight: data.weight,
          pregnancyNumber: data.pregnancy_number
        };
        onFinish(userProfile);
      } else {
        setLoginError(language === 'bn' ? 'ভুল পিন' : 'Invalid PIN');
      }
    } catch (e) {
      console.error("Login error", e);
      setLoginError(language === 'bn' ? 'সার্ভার ত্রুটি' : 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setIsTransitioning(false);
    }, 300);
  };
  
  const prevStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(s => Math.max(0, s - 1));
      setIsTransitioning(false);
    }, 300);
  };

  const calculateWeek = (date: Date) => {
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    const weeksRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
    let week = 40 - weeksRemaining;
    return Math.min(40, Math.max(1, week));
  };

  const handleFinish = async () => {
    if (!dueDate) return;
    setIsLoading(true);
    const currentWeek = calculateWeek(dueDate);
    const profileData = {
      name: name || 'Mama',
      phone_number: phoneNumber,
      pin,
      due_date: dueDate.toISOString().split('T')[0],
      current_week: currentWeek,
      language,
      onboarded: true,
      age: age ? parseInt(age) : null,
      weight: weight ? parseFloat(weight) : null,
      pregnancy_number: parseInt(pregnancyNumber)
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'phone_number' })
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No data returned");

      const savedProfile = data[0];

      onFinish({
        id: savedProfile.id,
        name: savedProfile.name,
        phoneNumber: savedProfile.phone_number,
        pin: savedProfile.pin,
        dueDate: savedProfile.due_date,
        currentWeek: savedProfile.current_week,
        language: savedProfile.language as Language,
        onboarded: savedProfile.onboarded,
        age: savedProfile.age,
        weight: savedProfile.weight,
        pregnancyNumber: savedProfile.pregnancy_number
      });
    } catch (e) {
      console.error("Signup error", e);
      alert(language === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const dayLabelsEn = ["S", "M", "T", "W", "T", "F", "S"];
  const dayLabelsBn = ["র", "সো", "ম", "বু", "বৃ", "শু", "শ"];

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = startDayOfMonth(year, month);
    const monthName = language === 'bn' ? monthNamesBn[month] : monthNamesEn[month];
    const dayLabels = language === 'bn' ? dayLabelsBn : dayLabelsEn;

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }
    for (let d = 1; d <= totalDays; d++) {
      const currentD = new Date(year, month, d);
      const isSelected = dueDate?.toDateString() === currentD.toDateString();
      const isPast = currentD < new Date(new Date().setHours(0,0,0,0));

      days.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => setDueDate(currentD)}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            isSelected 
              ? 'bg-pink-500 text-white shadow-lg scale-110' 
              : isPast 
                ? 'text-gray-200 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-pink-50 hover:text-pink-500'
          }`}
        >
          {language === 'bn' ? d.toLocaleString('bn-BD') : d}
        </button>
      );
    }

    return (
      <div className="bg-white border border-pink-50 rounded-3xl p-4 shadow-sm w-full mt-4 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-between items-center mb-4 px-2">
          <h4 className="font-bold text-gray-800">{monthName} {language === 'bn' ? year.toLocaleString('bn-BD', {useGrouping:false}) : year}</h4>
          <div className="flex gap-2">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-50 rounded-full text-gray-400"><ChevronLeft size={20}/></button>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-50 rounded-full text-gray-400"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map(l => <div key={l} className="text-[10px] font-black text-gray-300 uppercase text-center">{l}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        {dueDate && (
          <div className="mt-4 pt-4 border-t border-pink-50 text-center animate-in slide-in-from-top-2">
            <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">
              {language === 'bn' ? `আপনি বর্তমানে ${calculateWeek(dueDate).toLocaleString('bn-BD')} সপ্তাহে আছেন` : `You are currently in Week ${calculateWeek(dueDate)}`}
            </p>
          </div>
        )}
      </div>
    );
  };

  const steps = [
    {
      title: language === 'bn' ? "মা কেয়ার-এ স্বাগতম" : "Welcome to Maa Care",
      description: language === 'bn' ? "আপনার মাতৃত্বের সুন্দর যাত্রায় আমরা আছি আপনার পাশে।" : "Your intelligent companion through the beautiful journey of motherhood.",
      icon: (
        <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl shadow-pink-200 border-4 border-white animate-[pulse_3s_infinite]">
          <img src="/mask-icon.svg" alt="Maa Care Logo" className="w-full h-full object-cover" />
        </div>
      ),
      content: (
        <div className="flex flex-col gap-4 mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-2">ভাষা চয়ন করুন / Choose your language</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setLanguage('bn')}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 ${language === 'bn' ? 'bg-pink-500 text-white border-pink-500 shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-pink-200'}`}
            >
              বাংলা
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 ${language === 'en' ? 'bg-pink-500 text-white border-pink-500 shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-pink-200'}`}
            >
              English
            </button>
          </div>
          
          {canInstall && onInstall && (
            <button 
              onClick={onInstall}
              className="mt-4 w-full h-14 bg-pink-50 text-pink-600 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all border border-pink-100"
            >
              <Download size={20} />
              {language === 'bn' ? 'অ্যাপটি ইনস্টল করুন' : 'Install App'}
            </button>
          )}
        </div>
      )
    },
    {
      title: language === 'bn' ? "চলুন শুরু করি" : "Let's get to know you",
      description: language === 'bn' ? "আপনার নাম এবং যোগাযোগের তথ্য দিন।" : "Enter your name and contact details to secure your account.",
      icon: <Baby size={64} className="text-indigo-400 animate-[bounce_3s_infinite]" />,
      content: (
        <div className="space-y-4 mt-8 w-full text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "আপনার নাম" : "Your Name"}
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'bn' ? "যেমন: সারা" : "e.g. Sarah"}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-pink-400 focus:bg-white outline-none text-gray-800 font-semibold placeholder:text-gray-300 transition-all"
            />
          </div>
          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "ফোন নম্বর" : "Phone Number"}
            </label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-pink-400 focus:bg-white outline-none text-gray-800 font-semibold placeholder:text-gray-300 transition-all"
            />
          </div>
          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "৪ সংখ্যার পিন" : "4-Digit PIN"}
            </label>
            <input 
              type="password" 
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-pink-400 focus:bg-white outline-none text-gray-800 font-semibold placeholder:text-gray-300 transition-all text-center tracking-[1em]"
            />
          </div>
        </div>
      )
    },
    {
      title: language === 'bn' ? "আপনার শারীরিক তথ্য" : "Your Physical Profile",
      description: language === 'bn' ? "সঠিক পরামর্শের জন্য আপনার বয়স এবং ওজন প্রয়োজন।" : "We need your age and weight to provide personalized health insights.",
      icon: <Activity size={64} className="text-green-400 animate-[pulse_2s_infinite]" />,
      content: (
        <div className="space-y-4 mt-8 w-full text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "বয়স" : "Age"}
              </label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-pink-400 focus:bg-white outline-none text-gray-800 font-semibold placeholder:text-gray-300 transition-all"
              />
            </div>
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "ওজন (কেজি)" : "Weight (kg)"}
              </label>
              <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="60"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-pink-400 focus:bg-white outline-none text-gray-800 font-semibold placeholder:text-gray-300 transition-all"
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "এটি আপনার কততম সন্তান?" : "Which pregnancy is this?"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setPregnancyNumber(num.toString())}
                  className={`py-4 rounded-2xl font-bold transition-all border-2 ${pregnancyNumber === num.toString() ? 'bg-pink-500 text-white border-pink-500 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-pink-200'}`}
                >
                  {num}{num === 1 ? (language === 'bn' ? 'ম' : 'st') : num === 2 ? (language === 'bn' ? 'য়' : 'nd') : (language === 'bn' ? 'য়' : 'rd')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: language === 'bn' ? "প্রায় প্রস্তুত!" : "Almost Ready!",
      description: language === 'bn' ? "আপনার ডেলিভারির আনুমানিক তারিখটি কত?" : "When is your little one expected? Select your estimated due date below.",
      icon: <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 shadow-sm animate-[spin_10s_linear_infinite]"><CalendarIcon size={48} /></div>,
      content: renderCalendar()
    }
  ];

  const currentStepData = steps[step];

  if (isLoginMode) {
    return (
      <div className="flex flex-col h-full bg-white p-8 items-center justify-center text-center relative">
        <div className="absolute top-[-5%] left-[-5%] w-72 h-72 bg-pink-100 rounded-full blur-3xl opacity-40 pointer-events-none animate-float" />
        <div className="absolute bottom-[-5%] right-[-5%] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none animate-float-reverse" />
        
        <div className="z-10 w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-pink-50 rounded-3xl flex items-center justify-center text-pink-500 mb-4 shadow-inner">
              <Sparkles size={40} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{language === 'bn' ? 'লগইন করুন' : 'Welcome Back'}</h1>
            <p className="text-gray-500 text-sm mt-2">{language === 'bn' ? 'আপনার তথ্য দিয়ে প্রবেশ করুন' : 'Enter your details to continue'}</p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "ফোন নম্বর" : "Phone Number"}
              </label>
              <input 
                type="tel" 
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-pink-400 focus:bg-white outline-none text-gray-800 font-semibold transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "পিন" : "PIN"}
              </label>
              <input 
                type="password" 
                maxLength={4}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-pink-400 focus:bg-white outline-none text-gray-800 font-semibold text-center tracking-[1em] transition-all"
              />
            </div>
            {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              disabled={!loginPhone || loginPin.length < 4 || isLoading}
              className="w-full h-16 bg-pink-500 text-white rounded-2xl font-bold shadow-xl hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : (language === 'bn' ? 'প্রবেশ করুন' : 'Login')}
            </button>
            <button 
              onClick={() => setIsLoginMode(false)}
              className="w-full text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors"
            >
              {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create new account'}
            </button>

            {canInstall && onInstall && (
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={onInstall}
                  className="w-full h-14 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all border border-indigo-100"
                >
                  <Download size={20} />
                  {language === 'bn' ? 'অ্যাপটি ইনস্টল করুন' : 'Install App'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden relative">
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(10px, -20px) rotate(2deg); }
          66% { transform: translate(-15px, 15px) rotate(-1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes float-reverse {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-15px, 20px) rotate(-2deg); }
          66% { transform: translate(10px, -15px) rotate(1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-float { animation: float 15s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 18s ease-in-out infinite; }
      `}</style>

      {/* Background soft gradients with float animations */}
      <div className="absolute top-[-5%] left-[-5%] w-72 h-72 bg-pink-100 rounded-full blur-3xl opacity-40 pointer-events-none animate-float" />
      <div className="absolute bottom-[-5%] right-[-5%] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none animate-float-reverse" />

      {/* Progress Dots */}
      <div className="flex justify-center w-full pt-12 pb-4 z-10">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-700 ease-out ${i === step ? 'w-10 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'w-2 bg-gray-200'}`} 
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-32 flex flex-col items-center">
        <div className={`flex flex-col items-center max-w-sm w-full transition-all duration-300 z-10 ${isTransitioning ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} ${step === steps.length - 1 ? 'mt-4' : 'mt-8'}`}>
          <div className={`mb-6 drop-shadow-lg transition-transform hover:scale-105 duration-500 ${step === steps.length - 1 ? 'scale-75' : ''}`}>
            {currentStepData.icon}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight leading-tight text-center">{currentStepData.title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed font-medium px-4 mb-6 text-center">
            {currentStepData.description}
          </p>

          <div className="w-full max-w-[320px]">
            {currentStepData.content}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-gray-50 flex flex-col gap-4 z-20 safe-area-bottom">
        <div className="flex gap-4">
          {step > 0 && (
            <button 
              onClick={prevStep}
              className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-400 active:scale-90 transition-all border border-gray-100 shadow-sm hover:text-pink-500 hover:border-pink-200"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          
          <button 
            onClick={step === steps.length - 1 ? handleFinish : nextStep}
            disabled={(step === 1 && (!name || !phoneNumber || pin.length < 4)) || (step === steps.length - 1 && !dueDate) || isLoading}
            className={`flex-1 h-16 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale overflow-hidden relative group ${
              step === steps.length - 1 ? 'bg-green-500 shadow-green-100 hover:bg-green-600' : 'bg-pink-500 shadow-pink-100 hover:bg-pink-600'
            }`}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : step === steps.length - 1 ? (
              <>
                <span className="text-lg">{language === 'bn' ? "শুরু করুন" : "Get Started"}</span>
                <Check size={24} className="group-hover:scale-110 transition-transform" />
              </>
            ) : (
              <>
                <span className="text-lg">{language === 'bn' ? "পরবর্তী" : "Next"}</span>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {step <= 1 && (
          <button 
            onClick={() => setIsLoginMode(true)}
            className="text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors text-center"
          >
            {language === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'Already have an account? Login'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

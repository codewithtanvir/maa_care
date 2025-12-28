import React, { useState, useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';
import { 
  ArrowRight, 
  Baby, 
  Sparkles, 
  Check,
  ChevronLeft,
  Calendar as CalendarIcon,
  ChevronRight,
  Loader2,
  Download,
  Heart,
  Phone,
  Lock,
  User,
  Droplets,
  AlertCircle,
  Weight,
  Shield,
  Stethoscope,
  ChevronDown,
  Fingerprint,
  UserCircle2,
  HeartPulse,
  CalendarHeart,
  Globe
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
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [pregnancyNumber, setPregnancyNumber] = useState('1');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

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
        setLoginError(language === 'bn' ? 'কোনো অ্যাকাউন্ট পাওয়া যায়নি' : 'No account found');
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
          bloodGroup: data.blood_group,
          emergencyContactName: data.emergency_contact_name,
          emergencyContactPhone: data.emergency_contact_phone,
          pregnancyNumber: data.pregnancy_number,
          avatarSeed: data.avatar_seed
        };
        onFinish(userProfile);
      } else {
        setLoginError(language === 'bn' ? 'ভুল পিন' : 'Invalid PIN');
      }
    } catch (e) {
      console.error("Login error", e);
      setLoginError(language === 'bn' ? 'একটি সমস্যা হয়েছে' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWeekFromDueDate = (due: Date): number => {
    const today = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const totalPregnancyWeeks = 40;
    const dueTime = due.getTime();
    const nowTime = today.getTime();
    const weeksUntilDue = (dueTime - nowTime) / msPerWeek;
    const currentWeek = Math.round(totalPregnancyWeeks - weeksUntilDue);
    return Math.max(1, Math.min(42, currentWeek));
  };

  const handleFinish = async () => {
    setIsLoading(true);
    const currentWeek = dueDate ? calculateWeekFromDueDate(dueDate) : 1;
    const avatarSeed = Math.random().toString(36).substring(2, 8);
    
    try {
      const { data, error } = await supabase.from('profiles').insert({
        name,
        phone_number: phoneNumber,
        pin,
        due_date: dueDate?.toISOString().split('T')[0],
        current_week: currentWeek,
        language,
        onboarded: true,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        blood_group: bloodGroup || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        pregnancy_number: pregnancyNumber ? parseInt(pregnancyNumber) : 1,
        avatar_seed: avatarSeed
      }).select().single();

      if (error) throw error;

      const newProfile: UserProfile = {
        id: data.id,
        name,
        phoneNumber,
        pin,
        dueDate: dueDate?.toISOString().split('T')[0] || '',
        currentWeek,
        language,
        onboarded: true,
        age: age ? parseInt(age) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        bloodGroup: bloodGroup || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        pregnancyNumber: pregnancyNumber ? parseInt(pregnancyNumber) : 1,
        avatarSeed
      };
      onFinish(newProfile);
    } catch (e) {
      console.error("Error saving profile", e);
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
      setStep(s => s - 1); 
      setIsTransitioning(false); 
    }, 300);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const stepIcons = [
    { icon: Globe, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
    { icon: UserCircle2, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50' },
    { icon: HeartPulse, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
    { icon: CalendarHeart, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
  ];

  const steps = [
    // Step 0: Welcome & Language
    {
      icon: (
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-violet-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-violet-200 transform rotate-3">
            <Baby size={56} className="text-white drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <Heart size={20} className="text-white" />
          </div>
          <div className="absolute -top-2 -left-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
        </div>
      ),
      title: language === 'bn' ? "স্বাগতম মা! 💕" : "Welcome, Mom! 💕",
      description: language === 'bn' 
        ? "আপনার গর্ভাবস্থার সফরে আমরা আপনার সাথে আছি। প্রথমে আপনার পছন্দের ভাষা নির্বাচন করুন।" 
        : "We're here to support you through your beautiful pregnancy journey. First, choose your preferred language.",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { code: 'en', label: 'English', flag: '🇺🇸', sub: 'Continue in English' },
              { code: 'bn', label: 'বাংলা', flag: '🇧🇩', sub: 'বাংলায় চালিয়ে যান' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as Language)}
                className={`relative p-5 rounded-3xl border-2 transition-all duration-300 text-left group overflow-hidden ${
                  language === lang.code 
                    ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-purple-50 shadow-xl shadow-violet-100' 
                    : 'border-gray-100 bg-white hover:border-violet-200 hover:shadow-lg'
                }`}
              >
                {language === lang.code && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                <span className="text-3xl mb-2 block">{lang.flag}</span>
                <h3 className="font-bold text-gray-800 text-lg">{lang.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{lang.sub}</p>
              </button>
            ))}
          </div>
          
          {canInstall && onInstall && (
            <button 
              onClick={onInstall}
              className="w-full mt-6 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-200"
            >
              <Download size={20} />
              {language === 'bn' ? 'অ্যাপটি ইনস্টল করুন' : 'Install App for Best Experience'}
            </button>
          )}
        </div>
      ),
    },
    // Step 1: Personal Info
    {
      icon: (
        <div className="relative">
          <div className="w-28 h-28 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-pink-200 transform -rotate-3">
            <Shield size={48} className="text-white drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Lock size={18} className="text-white" />
          </div>
        </div>
      ),
      title: language === 'bn' ? "আপনার পরিচয় 👋" : "Let's Meet You 👋",
      description: language === 'bn' 
        ? "আপনার নাম এবং নিরাপত্তার জন্য একটি পিন সেট করুন।" 
        : "Tell us your name and set up a secure PIN to protect your data.",
      content: (
        <div className="space-y-5">
          {/* Name Input */}
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "আপনার নাম" : "Your Name"}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                <User size={18} className="text-pink-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'bn' ? "নাম লিখুন" : "Enter your name"}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-16 pr-5 focus:border-pink-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "ফোন নম্বর" : "Phone Number"}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Phone size={18} className="text-blue-500" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-16 pr-5 focus:border-blue-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* PIN Input */}
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "নিরাপত্তা পিন (৪ সংখ্যা)" : "Security PIN (4 digits)"}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <Fingerprint size={18} className="text-violet-500" />
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-16 pr-5 focus:border-violet-300 focus:bg-white outline-none text-gray-800 font-bold text-center tracking-[0.75em] transition-all"
              />
            </div>
            {/* PIN Dots Indicator */}
            <div className="flex justify-center gap-3 mt-3">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    pin.length > i 
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 scale-110' 
                      : 'bg-gray-200'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Step 2: Physical Profile
    {
      icon: (
        <div className="relative">
          <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
            <Stethoscope size={48} className="text-white drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart size={18} className="text-white" />
          </div>
        </div>
      ),
      title: language === 'bn' ? "স্বাস্থ্য তথ্য 💚" : "Health Profile 💚",
      description: language === 'bn' 
        ? "আপনার স্বাস্থ্য তথ্য আমাদের আরও ভালো পরামর্শ দিতে সাহায্য করবে।" 
        : "Your health details help us provide personalized care and recommendations.",
      content: (
        <div className="space-y-4">
          {/* Age & Weight Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "বয়স" : "Age"}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <User size={14} className="text-emerald-500" />
                </div>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3.5 pl-13 pr-4 focus:border-emerald-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all text-center"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "ওজন (কেজি)" : "Weight (kg)"}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Weight size={14} className="text-blue-500" />
                </div>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="60"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3.5 pl-13 pr-4 focus:border-blue-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all text-center"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>
          </div>

          {/* Pregnancy Number & Blood Group Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "গর্ভধারণ নম্বর" : "Pregnancy #"}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
                  <Baby size={14} className="text-pink-500" />
                </div>
                <select
                  value={pregnancyNumber}
                  onChange={(e) => setPregnancyNumber(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3.5 pl-13 pr-4 focus:border-pink-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all appearance-none text-center"
                  style={{ paddingLeft: '3rem' }}
                >
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{language === 'bn' ? `${n}ম` : `${n}${n===1?'st':n===2?'nd':n===3?'rd':'th'}`}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
                {language === 'bn' ? "রক্তের গ্রুপ" : "Blood Type"}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Droplets size={14} className="text-red-500" />
                </div>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3.5 pl-13 pr-4 focus:border-red-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all appearance-none text-center"
                  style={{ paddingLeft: '3rem' }}
                >
                  <option value="">{language === 'bn' ? 'নির্বাচন' : 'Select'}</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "জরুরি যোগাযোগ (নাম)" : "Emergency Contact (Name)"}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <User size={18} className="text-orange-500" />
              </div>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder={language === 'bn' ? "নাম লিখুন" : "Contact name"}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-16 pr-5 focus:border-orange-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Emergency Contact Phone */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
              {language === 'bn' ? "জরুরি যোগাযোগ (ফোন)" : "Emergency Contact (Phone)"}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle size={18} className="text-red-500" />
              </div>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder={language === 'bn' ? "ফোন নম্বর" : "Phone number"}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-16 pr-5 focus:border-red-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      ),
    },
    // Step 3: Due Date
    {
      icon: (
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-amber-200 transform rotate-3">
            <CalendarIcon size={40} className="text-white drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce">
            <Baby size={18} className="text-white" />
          </div>
        </div>
      ),
      title: language === 'bn' ? "কবে আসছে আপনার শিশু? 👶" : "When is Baby Coming? 👶",
      description: language === 'bn' 
        ? "আপনার প্রত্যাশিত প্রসবের তারিখ নির্বাচন করুন।" 
        : "Select your expected due date so we can track your journey together.",
      content: (
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border-2 border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-amber-100"
              >
                <ChevronLeft size={20} className="text-amber-600" />
              </button>
              <div className="text-center">
                <h3 className="font-bold text-gray-800 text-lg">
                  {viewDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long' })}
                </h3>
                <p className="text-amber-600 font-semibold text-sm">{viewDate.getFullYear()}</p>
              </div>
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 border border-amber-100"
              >
                <ChevronRight size={20} className="text-amber-600" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {(language === 'bn' ? ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map((day, i) => (
                <div key={i} className="h-8 flex items-center justify-center text-xs font-bold text-amber-600/60">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: getFirstDayOfMonth(viewDate) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {Array.from({ length: getDaysInMonth(viewDate) }).map((_, i) => {
                const day = i + 1;
                const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isSelected = dueDate?.toDateString() === date.toDateString();
                const isPast = date < new Date(new Date().setHours(0,0,0,0));
                
                return (
                  <button
                    key={day}
                    onClick={() => !isPast && setDueDate(date)}
                    disabled={isPast}
                    className={`h-10 rounded-xl text-sm font-bold transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200 scale-110' 
                        : isPast 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-700 hover:bg-white hover:shadow-md active:scale-95'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Display */}
          {dueDate && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-xl shadow-green-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Baby size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-green-100 text-xs font-semibold uppercase tracking-wider">
                    {language === 'bn' ? 'প্রত্যাশিত তারিখ' : 'Expected Due Date'}
                  </p>
                  <p className="font-bold text-xl">
                    {dueDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-green-100 text-sm font-medium mt-0.5">
                    {language === 'bn' ? `সপ্তাহ ${calculateWeekFromDueDate(dueDate)}` : `Week ${calculateWeekFromDueDate(dueDate)} of pregnancy`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const currentStepData = steps[step];

  // Login Mode UI
  if (isLoginMode) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-pink-50 via-white to-violet-50 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-gradient-to-br from-pink-200 to-rose-300 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-gradient-to-br from-violet-200 to-purple-300 rounded-full blur-3xl opacity-30" />
        
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-sm space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[1.75rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-pink-200 transform -rotate-3">
                <Heart size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                {language === 'bn' ? 'স্বাগতম!' : 'Welcome Back!'}
              </h1>
              <p className="text-gray-500 mt-2 font-medium">
                {language === 'bn' ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'Sign in to continue your journey'}
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-5">
              {/* Phone Input */}
              <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
                  {language === 'bn' ? "ফোন নম্বর" : "Phone Number"}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                    <Phone size={18} className="text-pink-500" />
                  </div>
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => { setLoginPhone(e.target.value); setLoginError(''); }}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-16 pr-5 focus:border-pink-300 focus:bg-white outline-none text-gray-800 font-semibold transition-all"
                  />
                </div>
              </div>

              {/* PIN Input */}
              <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">
                  {language === 'bn' ? "পিন" : "Security PIN"}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                    <Lock size={18} className="text-violet-500" />
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => { setLoginPin(e.target.value.replace(/\D/g, '')); setLoginError(''); }}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-16 pr-5 focus:border-violet-300 focus:bg-white outline-none text-gray-800 font-bold text-center tracking-[0.75em] transition-all"
                  />
                </div>
                {/* PIN Dots */}
                <div className="flex justify-center gap-3 mt-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-all ${
                        loginPin.length > i 
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                          : 'bg-gray-200'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm font-semibold">{loginError}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                disabled={!loginPhone || loginPin.length < 4 || isLoading}
                className="w-full h-16 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-bold shadow-xl shadow-pink-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <span className="text-lg">{language === 'bn' ? 'প্রবেশ করুন' : 'Sign In'}</span>
                    <ArrowRight size={22} />
                  </>
                )}
              </button>

              <button
                onClick={() => setIsLoginMode(false)}
                className="w-full text-gray-500 font-bold hover:text-pink-500 transition-colors py-3"
              >
                {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create New Account'}
              </button>

              {canInstall && onInstall && (
                <button
                  onClick={onInstall}
                  className="w-full h-14 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all border-2 border-indigo-100"
                >
                  <Download size={20} />
                  {language === 'bn' ? 'অ্যাপটি ইনস্টল করুন' : 'Install App'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Flow
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-pink-50 via-white to-violet-50 relative overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-3deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
      `}</style>

      {/* Decorative Background Elements */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-gradient-to-br from-pink-200 to-rose-300 rounded-full blur-3xl opacity-40 animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-72 h-72 bg-gradient-to-br from-violet-200 to-purple-300 rounded-full blur-3xl opacity-40 animate-float-reverse pointer-events-none" />
      <div className="absolute top-[30%] right-[5%] w-40 h-40 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full blur-3xl opacity-30 pointer-events-none" />

      {/* Progress Indicator */}
      <div className="relative z-20 pt-12 pb-4 px-8">
        <div className="flex items-center justify-between max-w-xs mx-auto">
          {steps.map((_, i) => {
            const StepIcon = stepIcons[i].icon;
            const isActive = i === step;
            const isCompleted = i < step;
            
            return (
              <React.Fragment key={i}>
                <div className={`relative transition-all duration-500 ${isActive ? 'scale-110' : ''}`}>
                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200' 
                        : isActive 
                          ? `bg-gradient-to-br ${stepIcons[i].color} shadow-xl` 
                          : 'bg-gray-100'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={20} className="text-white" />
                    ) : (
                      <StepIcon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                    )}
                  </div>
                  {isActive && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stepIcons[i].color} animate-ping opacity-30`} />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                    i < step ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-center mt-4 text-sm font-semibold text-gray-500">
          {language === 'bn' ? `ধাপ ${step + 1} / ${steps.length}` : `Step ${step + 1} of ${steps.length}`}
        </p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-36 relative z-10">
        <div className={`flex flex-col items-center max-w-sm w-full mx-auto transition-all duration-300 ${
          isTransitioning ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
        }`}>
          {/* Icon */}
          <div className="mb-6 mt-4">
            {currentStepData.icon}
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl font-black text-gray-800 mb-2 tracking-tight text-center">
            {currentStepData.title}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed font-medium px-4 mb-8 text-center max-w-[280px]">
            {currentStepData.description}
          </p>

          {/* Step Content */}
          <div className="w-full">
            {currentStepData.content}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-5 z-30 safe-area-bottom">
        <div className="flex gap-4 max-w-sm mx-auto">
          {step > 0 && (
            <button
              onClick={prevStep}
              className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-90 transition-all border-2 border-gray-100 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          
          <button
            onClick={step === steps.length - 1 ? handleFinish : nextStep}
            disabled={(step === 1 && (!name || !phoneNumber || pin.length < 4)) || (step === steps.length - 1 && !dueDate) || isLoading}
            className={`flex-1 h-16 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale relative overflow-hidden group ${
              step === steps.length - 1 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200' 
                : `bg-gradient-to-r ${stepIcons[step].color}`
            }`}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : step === steps.length - 1 ? (
              <>
                <span className="text-lg">{language === 'bn' ? "শুরু করুন" : "Get Started"}</span>
                <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
              </>
            ) : (
              <>
                <span className="text-lg">{language === 'bn' ? "পরবর্তী" : "Continue"}</span>
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Login Link */}
        {step <= 1 && (
          <button
            onClick={() => setIsLoginMode(true)}
            className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-pink-500 transition-colors text-center"
          >
            {language === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'Already have an account? Sign In'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

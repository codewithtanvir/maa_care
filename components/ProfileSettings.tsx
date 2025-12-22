
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { Settings, Bell, Shield, LogOut, ChevronRight, Camera, Globe, Check, X, ArrowLeft, Loader2, User, Phone, Calendar, Hash, Activity } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onLogout: () => void;
  onBack: () => void;
  onInstall?: () => void;
  canInstall?: boolean;
}

const ProfileSettings: React.FC<Props> = ({ user, onUpdate, onLogout, onBack, onInstall, canInstall }) => {
  const t = translations[user?.language || 'en'] || translations.en;
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [dueDate, setDueDate] = useState(user?.dueDate || '');
  const [currentWeek, setCurrentWeek] = useState(user?.currentWeek || 1);
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [pregnancyNumber, setPregnancyNumber] = useState(user?.pregnancyNumber?.toString() || '1');
  const [isSaving, setIsSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLanguageSwitch = async (lang: Language) => {
    if (!user.id) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', user.id);
      
      if (!error) {
        onUpdate({ ...user, language: lang });
      }
    } catch (e) {
      console.error("Error updating language", e);
    }
  };

  const handleSave = async () => {
    if (!user.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name, 
          phone_number: phoneNumber, 
          pin, 
          due_date: dueDate, 
          current_week: currentWeek,
          age: age ? parseInt(age) : null,
          weight: weight ? parseFloat(weight) : null,
          pregnancy_number: parseInt(pregnancyNumber)
        })
        .eq('id', user.id);

      if (!error) {
        onUpdate({ 
          ...user, 
          name, 
          phoneNumber, 
          pin, 
          dueDate, 
          currentWeek,
          age: age ? parseInt(age) : null,
          weight: weight ? parseFloat(weight) : null,
          pregnancyNumber: parseInt(pregnancyNumber)
        });
        const lang = user?.language || 'en';
        alert(lang === 'bn' ? 'প্রোফাইল আপডেট করা হয়েছে!' : 'Profile Updated!');
      } else {
        throw error;
      }
    } catch (e) {
      console.error("Error saving profile", e);
      alert(user.language === 'bn' ? 'সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t.profile}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'Mama'}`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-rose-500 text-white rounded-full shadow-md border-2 border-white active:scale-90 transition-transform">
              <Camera size={14} />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{name || 'Mama'}</h2>
          <p className="text-rose-500 font-semibold text-sm">
            {t.week} {currentWeek} • {user.language === 'bn' ? 'প্রত্যাশিত মা' : 'Expectant Mother'}
          </p>
        </div>

        {/* Language Selector */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex relative">
          <div 
            className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-rose-500 rounded-2xl transition-all duration-300 ease-out"
            style={{ 
              transform: user.language === 'bn' ? 'translateX(100%)' : 'translateX(0%)',
              left: '4px',
              top: '4px'
            }}
          />
          <button
            onClick={() => handleLanguageSwitch('en')}
            className={`flex-1 py-3 text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${
              user.language === 'en' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <Globe size={16} />
            English
          </button>
          <button
            onClick={() => handleLanguageSwitch('bn')}
            className={`flex-1 py-3 text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${
              user.language === 'bn' ? 'text-white' : 'text-gray-500'
            }`}
          >
            বাংলা
          </button>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-rose-500" />
            {user.language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Information'}
          </h3>
          
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-medium text-gray-500 mb-1 block ml-1">{user.language === 'bn' ? 'নাম' : 'Full Name'}</label>
              <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
                <User size={18} className="text-gray-400 mr-3" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none p-0 w-full text-gray-800 font-semibold focus:ring-0"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block ml-1">{user.language === 'bn' ? 'ফোন' : 'Phone'}</label>
                <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
                  <Phone size={18} className="text-gray-400 mr-3" />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-transparent border-none p-0 w-full text-gray-800 font-semibold focus:ring-0"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block ml-1">{user.language === 'bn' ? 'প্রসবের তারিখ' : 'Due Date'}</label>
                <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
                  <Calendar size={18} className="text-gray-400 mr-3" />
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-transparent border-none p-0 w-full text-gray-800 font-semibold focus:ring-0"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-medium text-gray-500 mb-1 block ml-1">{t.week}</label>
              <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
                <Hash size={18} className="text-gray-400 mr-3" />
                <input 
                  type="number" 
                  value={currentWeek}
                  onChange={(e) => setCurrentWeek(parseInt(e.target.value) || 0)}
                  className="bg-transparent border-none p-0 w-full text-gray-800 font-semibold focus:ring-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block ml-1">{user.language === 'bn' ? 'বয়স' : 'Age'}</label>
                <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
                  <User size={18} className="text-gray-400 mr-3" />
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="bg-transparent border-none p-0 w-full text-gray-800 font-semibold focus:ring-0"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block ml-1">{user.language === 'bn' ? 'ওজন (কেজি)' : 'Weight (kg)'}</label>
                <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
                  <Activity size={18} className="text-gray-400 mr-3" />
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="bg-transparent border-none p-0 w-full text-gray-800 font-semibold focus:ring-0"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-medium text-gray-500 mb-1 block ml-1">{user.language === 'bn' ? 'সন্তান সংখ্যা' : 'Pregnancy Number'}</label>
              <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
                <Hash size={18} className="text-gray-400 mr-3" />
                <select 
                  value={pregnancyNumber}
                  onChange={(e) => setPregnancyNumber(e.target.value)}
                  className="bg-transparent border-none p-0 w-full text-gray-800 font-semibold focus:ring-0 outline-none"
                >
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th+</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-100 active:scale-95 transition-all mt-2 hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : t.save}
          </button>
        </div>

        {/* Security / PIN Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-rose-500" />
              {user.language === 'bn' ? 'নিরাপত্তা পিন' : 'Security PIN'}
            </h3>
            <button 
              onClick={() => setShowPin(!showPin)}
              className="text-rose-500 text-[10px] font-black uppercase tracking-[0.15em] bg-rose-50 px-3 py-1 rounded-full active:scale-95 transition-all"
            >
              {showPin ? (user.language === 'bn' ? 'লুকান' : 'Hide') : (user.language === 'bn' ? 'দেখুন' : 'Show')}
            </button>
          </div>
          
          <p className="text-[11px] text-gray-400 leading-relaxed px-1">
            {user.language === 'bn' 
              ? 'আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে একটি ৪-সংখ্যার পিন সেট করুন।' 
              : 'Set a 4-digit PIN to keep your health logs and personal data private.'}
          </p>

          <div className="relative flex flex-col items-center py-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-300 ${
                    pin.length === i ? 'border-rose-500 bg-white shadow-lg shadow-rose-100 scale-110 z-10' : 
                    pin.length > i ? 'border-rose-200 bg-rose-50 text-rose-600' : 
                    'border-gray-100 bg-white text-gray-200'
                  }`}
                >
                  {pin[i] ? (showPin ? pin[i] : '●') : ''}
                </div>
              ))}
            </div>
            
            <input 
              type="tel" 
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
              autoFocus={false}
            />

            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                {user.language === 'bn' ? 'পরিবর্তন করতে এখানে ট্যাপ করুন' : 'Tap boxes to change'}
              </p>
              {pin.length > 0 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPin('');
                  }} 
                  className="p-1 text-gray-300 hover:text-rose-500 transition-colors relative z-30"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          {pin.length > 0 && pin.length < 4 && (
            <p className="text-[10px] text-amber-500 font-bold text-center animate-bounce">
              {user.language === 'bn' ? '৪টি সংখ্যা প্রয়োজন' : '4 digits required'}
            </p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-4 space-y-3">
          {canInstall && onInstall && (
            <button 
              onClick={onInstall}
              className="w-full flex items-center justify-center gap-2 p-4 text-pink-600 font-bold bg-pink-50 border border-pink-100 rounded-2xl active:scale-95 transition-all hover:bg-pink-100"
            >
              <Download size={20} /> {t.installApp}
            </button>
          )}

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-gray-600 font-bold bg-white border border-gray-100 rounded-2xl active:scale-95 transition-all hover:bg-gray-50"
          >
            <LogOut size={20} /> {user.language === 'bn' ? 'সাইন আউট' : 'Sign Out'}
          </button>

          <button 
            onClick={async () => {
              if (window.confirm(user.language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট মুছতে চান? এটি আপনার সমস্ত ডেটা মুছে ফেলবে।' : 'Are you sure you want to delete your account? This will erase all your data.')) {
                try {
                  const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                  if (!error) onLogout();
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            className="w-full p-4 text-gray-400 text-[10px] font-bold hover:text-red-500 transition-colors uppercase tracking-widest"
          >
            {user.language === 'bn' ? 'অ্যাকাউন্ট মুছে ফেলুন' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;


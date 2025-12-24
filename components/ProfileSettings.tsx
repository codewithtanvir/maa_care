import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { Shield, LogOut, ChevronRight, Camera, Globe, Check, X, ArrowLeft, Loader2, User, Phone, Calendar, Hash, Activity, Download, Trash2, Languages, Heart, AlertCircle, Droplets } from 'lucide-react';
import SettingsCard from './SettingsCard';
import Input from './Input';
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
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || name || 'Mama');

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
          pregnancy_number: parseInt(pregnancyNumber),
          blood_group: bloodGroup,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          avatar_seed: avatarSeed
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
          pregnancyNumber: parseInt(pregnancyNumber),
          bloodGroup,
          emergencyContactName,
          emergencyContactPhone,
          avatarSeed
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

  const handleDeleteAccount = async () => {
    if (!user.id) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (!error) onLogout();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md w-full px-6 py-4 flex items-center justify-between border-b border-pink-100/50 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-pink-50 rounded-xl transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">{t.profile}</h1>
            <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">
              {isEditing ? (user.language === 'bn' ? 'সম্পাদনা মোড' : 'Editing Mode') : 'Settings & Preferences'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2"
            >
              <User size={16} />
              {user.language === 'bn' ? 'সম্পাদনা' : 'Edit'}
            </button>
          ) : (
            <button 
              onClick={async () => {
                await handleSave();
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : t.save}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-5">
        {/* Profile Identity Card - More Compact & Premium */}
        <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 shadow-sm border border-pink-100/50 flex items-center gap-5 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-50 to-rose-50/30 rounded-full -mr-16 -mt-16 -z-10 blur-2xl" />
          
          <div className="relative shrink-0">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-1 shadow-lg ring-4 ring-pink-50 overflow-hidden transition-transform duration-500 group-hover:scale-105">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=ffdfbf,ffd5dc,d1d4f9`} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-2xl" 
              />
            </div>
            <button 
              onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
              className="absolute -bottom-1 -right-1 p-2 bg-pink-500 text-white rounded-xl shadow-lg border-2 border-white active:scale-90 transition-all hover:bg-pink-600"
            >
              <Camera size={14} strokeWidth={2.5} />
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-800 tracking-tight truncate mb-1">{name || 'Mama'}</h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 rounded-full">
                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                <p className="text-pink-600 font-black text-[10px] uppercase tracking-wider">
                  {t.week} {currentWeek}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full">
                <p className="text-indigo-600 font-black text-[10px] uppercase tracking-wider">
                  {bloodGroup || 'O+'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-[1.5rem] border border-pink-50 shadow-sm text-center">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{user.language === 'bn' ? 'বয়স' : 'Age'}</p>
            {isEditing ? (
              <input 
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-sm font-black text-gray-800 text-center focus:ring-0 outline-none"
              />
            ) : (
              <p className="text-sm font-black text-gray-800">{age || '--'}</p>
            )}
          </div>
          <div className="bg-white p-4 rounded-[1.5rem] border border-pink-50 shadow-sm text-center">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{user.language === 'bn' ? 'ওজন' : 'Weight'}</p>
            {isEditing ? (
              <div className="flex items-center justify-center">
                <input 
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-12 bg-transparent border-none p-0 text-sm font-black text-gray-800 text-center focus:ring-0 outline-none"
                />
                <span className="text-xs text-gray-500 font-bold ml-0.5">kg</span>
              </div>
            ) : (
              <p className="text-sm font-black text-gray-800">{weight || '--'} <span className="text-xs text-gray-500 font-bold ml-0.5">kg</span></p>
            )}
          </div>
          <div className="bg-white p-4 rounded-[1.5rem] border border-pink-50 shadow-sm text-center">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{user.language === 'bn' ? 'গর্ভাবস্থা' : 'Pregnancy'}</p>
            {isEditing ? (
              <select 
                value={pregnancyNumber}
                onChange={(e) => setPregnancyNumber(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-sm font-black text-gray-800 text-center focus:ring-0 outline-none appearance-none"
              >
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th+</option>
              </select>
            ) : (
              <p className="text-sm font-black text-gray-800">{pregnancyNumber}<span className="text-xs text-gray-500 font-bold ml-0.5">{pregnancyNumber === '1' ? 'st' : pregnancyNumber === '2' ? 'nd' : 'rd'}</span></p>
            )}
          </div>
        </div>

        {/* Language Toggle - More Compact */}
        <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-pink-100/50 flex items-center justify-between">
          <div className="flex items-center gap-3 ml-1">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Languages size={18} />
            </div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Language</h3>
          </div>
          <div className="bg-slate-50 rounded-xl p-1 flex relative w-36">
            <div 
              className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white shadow-sm rounded-lg transition-all duration-300 ease-out"
              style={{ 
                transform: user.language === 'bn' ? 'translateX(100%)' : 'translateX(0%)',
                left: '4px',
                top: '4px'
              }}
            />
            <button
              onClick={() => handleLanguageSwitch('en')}
              className={`flex-1 py-2 text-[10px] font-black z-10 transition-colors duration-300 ${
                user.language === 'en' ? 'text-pink-500' : 'text-gray-500'
              }`}
            >
              ENGLISH
            </button>
            <button
              onClick={() => handleLanguageSwitch('bn')}
              className={`flex-1 py-2 text-[10px] font-black z-10 transition-colors duration-300 ${
                user.language === 'bn' ? 'text-pink-500' : 'text-gray-500'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        {/* Information Sections */}
        <div className="space-y-4">
          <SettingsCard title={user.language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Medical Profile'} icon={<Activity size={18} />}>
            <div className="space-y-4">
              <Input 
                label={user.language === 'bn' ? 'নাম' : 'Full Name'}
                icon={<User size={16} />}
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                disabled={!isEditing}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={user.language === 'bn' ? 'ফোন' : 'Phone'}
                  icon={<Phone size={16} />}
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label={user.language === 'bn' ? 'প্রসবের তারিখ' : 'Due Date'}
                  icon={<Calendar size={16} />}
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block ml-1">{user.language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</label>
                  <div className={`flex items-center bg-slate-50 rounded-xl px-3 py-2.5 border-2 border-transparent transition-all ${isEditing ? 'group-focus-within:border-pink-100 group-focus-within:bg-white' : 'opacity-60'}`}>
                    <Droplets size={16} className="text-pink-400 mr-2" />
                    <select 
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      disabled={!isEditing}
                      className="bg-transparent border-none p-0 w-full text-xs font-bold text-gray-800 focus:ring-0 outline-none disabled:cursor-not-allowed"
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block ml-1">{user.language === 'bn' ? 'সন্তান সংখ্যা' : 'Pregnancy'}</label>
                  <div className={`flex items-center bg-slate-50 rounded-xl px-3 py-2.5 border-2 border-transparent transition-all ${isEditing ? 'group-focus-within:border-pink-100 group-focus-within:bg-white' : 'opacity-60'}`}>
                    <Hash size={16} className="text-gray-400 mr-2" />
                    <select 
                      value={pregnancyNumber}
                      onChange={(e) => setPregnancyNumber(e.target.value)}
                      disabled={!isEditing}
                      className="bg-transparent border-none p-0 w-full text-xs font-bold text-gray-800 focus:ring-0 outline-none disabled:cursor-not-allowed"
                    >
                      <option value="1">1st</option>
                      <option value="2">2nd</option>
                      <option value="3">3rd</option>
                      <option value="4">4th+</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Emergency Contact Section */}
          <SettingsCard title={user.language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact'} icon={<AlertCircle size={18} className="text-red-500" />}>
            <div className="space-y-3">
              <Input 
                label={user.language === 'bn' ? 'নাম' : 'Contact Name'}
                icon={<User size={16} />}
                type="text" 
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Husband, Mother, etc."
                disabled={!isEditing}
              />
              <Input 
                label={user.language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                icon={<Phone size={16} />}
                type="tel" 
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                disabled={!isEditing}
              />
            </div>
          </SettingsCard>

          {/* Security / PIN Section */}
          <SettingsCard title={user.language === 'bn' ? 'নিরাপত্তা পিন' : 'Privacy & Security'} icon={<Shield size={18} />}>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-bold text-gray-500 leading-tight pr-4">
                  {user.language === 'bn' 
                    ? 'আপনার ডেটা সুরক্ষিত রাখতে ৪-সংখ্যার পিন ব্যবহার করুন।' 
                    : 'Use a 4-digit PIN to keep your health data private and secure.'}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setPin(''); setShowPin(true); }}
                    className="shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-500 rounded-lg text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  >
                    {user.language === 'bn' ? 'পরিবর্তন' : 'Change'}
                  </button>
                  <button 
                    onClick={() => setShowPin(!showPin)}
                    className="shrink-0 px-3 py-1.5 bg-pink-50 text-pink-500 rounded-lg text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  >
                    {showPin ? (user.language === 'bn' ? 'লুকান' : 'Hide') : (user.language === 'bn' ? 'দেখুন' : 'Show')}
                  </button>
                </div>
              </div>
              
              <div className="relative flex flex-col items-center py-1">
                <div className="flex justify-center gap-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all duration-300 ${
                        pin.length === i ? 'border-pink-500 bg-white shadow-lg shadow-pink-100 -translate-y-0.5 scale-105 z-10' : 
                        pin.length > i ? 'border-pink-200 bg-pink-50 text-pink-600' : 
                        'border-slate-100 bg-slate-50 text-slate-200'
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
                />
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 space-y-3">
          <div className="h-px bg-gradient-to-r from-transparent via-pink-100 to-transparent w-full" />
          
          <div className="grid grid-cols-1 gap-2.5">
            {canInstall && onInstall && (
              <button 
                onClick={onInstall}
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[1.5rem] shadow-lg shadow-pink-200 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Download size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black tracking-tight">{t.installApp}</p>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">PWA Version</p>
                  </div>
                </div>
                <ChevronRight size={18} className="opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button 
              onClick={onLogout}
              className="group flex items-center justify-between p-4 bg-white border border-pink-100 rounded-[1.5rem] shadow-sm active:scale-[0.98] transition-all hover:bg-pink-50/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-pink-100 group-hover:text-pink-500 transition-colors">
                  <LogOut size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-gray-800 tracking-tight">{user.language === 'bn' ? 'সাইন আউট' : 'Sign Out'}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Logout from device</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={async () => {
                if (window.confirm(user.language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট মুছতে চান?' : 'Are you sure you want to delete your account?')) {
                  try {
                    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                    if (!error) onLogout();
                  } catch (e) {
                    console.error(e);
                  }
                }
              }}
              className="flex items-center justify-center gap-2 p-4 text-red-400 hover:text-red-500 transition-all active:scale-95"
            >
              <Trash2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {user.language === 'bn' ? 'অ্যাকাউন্ট মুছে ফেলুন' : 'Delete My Account'}
              </span>
            </button>
          </div>

          <div className="text-center pb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Maa Care • Version 2.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

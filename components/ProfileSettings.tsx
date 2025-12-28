
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { Shield, LogOut, ChevronRight, Camera, ArrowLeft, Loader2, User, Phone, Calendar, Hash, Activity, Download, Trash2, Languages, AlertCircle, Droplets, Heart, Baby, Sparkles, CheckCircle, Settings, Bell, HelpCircle, Star, Crown } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState<'profile' | 'health' | 'emergency' | 'settings' | null>(null);
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || name || 'Mama');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // PIN Change States
  const [pinStep, setPinStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

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
          age: age ? parseInt(age) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
          pregnancyNumber: parseInt(pregnancyNumber),
          bloodGroup,
          emergencyContactName,
          emergencyContactPhone,
          avatarSeed
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw error;
      }
    } catch (e) {
      console.error("Error saving profile", e);
    } finally {
      setIsSaving(false);
    }
  };

  const progress = ((currentWeek || 1) / 40) * 100;

  // Section Modal Component
  const SectionModal = ({ isOpen, onClose, title, icon, children }: { isOpen: boolean; onClose: () => void; title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500">
                {icon}
              </div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">{title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"
            >
              <ChevronRight size={20} className="rotate-90" />
            </button>
          </div>
          {children}
          <button
            onClick={() => { handleSave(); onClose(); }}
            disabled={isSaving}
            className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-pink-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (
              <>
                <CheckCircle size={18} />
                {user.language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Input Field Component
  const InputField = ({ label, value, onChange, type = 'text', placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative flex items-center">
        {icon && <div className="absolute left-4 text-gray-400">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-50 border-2 border-transparent rounded-xl py-3.5 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:border-pink-200 focus:bg-white transition-all outline-none ${icon ? 'pl-12 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#FDFCFD] overflow-hidden">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle size={18} />
          <span className="text-sm font-bold">{user.language === 'bn' ? 'সংরক্ষিত হয়েছে!' : 'Saved Successfully!'}</span>
        </div>
      )}

      {/* Premium Header */}
      <div className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 px-6 pt-6 pb-28 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 mb-10 blur-2xl" />
        
        {/* Header Actions */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button 
            onClick={onBack} 
            className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-white tracking-tight">{t.profile}</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Profile Card - Floating */}
        <div className="absolute left-6 right-6 -bottom-20 z-20">
          <div className="bg-white rounded-[2rem] p-5 shadow-xl shadow-pink-200/30 border border-pink-50">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-50 rounded-2xl flex items-center justify-center p-1 shadow-inner overflow-hidden ring-4 ring-pink-50">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=ffdfbf,ffd5dc,d1d4f9`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-xl" 
                  />
                </div>
                <button 
                  onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
                  className="absolute -bottom-1 -right-1 p-2 bg-pink-500 text-white rounded-xl shadow-lg shadow-pink-200 border-2 border-white active:scale-90 transition-all"
                >
                  <Camera size={12} strokeWidth={3} />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight truncate">{name || 'Mama'}</h2>
                  <div className="p-1 bg-amber-100 rounded-lg">
                    <Crown size={12} className="text-amber-500" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-pink-50 text-pink-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {t.week} {currentWeek}
                  </span>
                  {bloodGroup && (
                    <span className="px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Droplets size={10} /> {bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mini Progress */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.language === 'bn' ? 'গর্ভাবস্থার অগ্রগতি' : 'Pregnancy Progress'}</span>
                <span className="text-[10px] font-black text-pink-500">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-24 pb-32 space-y-4">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <User size={16} className="text-indigo-500" />
            </div>
            <p className="text-lg font-black text-gray-900">{age || '--'}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.language === 'bn' ? 'বয়স' : 'Age'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Activity size={16} className="text-green-500" />
            </div>
            <p className="text-lg font-black text-gray-900">{weight || '--'}<span className="text-xs font-bold text-gray-400 ml-0.5">kg</span></p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.language === 'bn' ? 'ওজন' : 'Weight'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Baby size={16} className="text-pink-500" />
            </div>
            <p className="text-lg font-black text-gray-900">{pregnancyNumber}<span className="text-xs font-bold text-gray-400 ml-0.5">{pregnancyNumber === '1' ? 'st' : pregnancyNumber === '2' ? 'nd' : 'rd'}</span></p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.language === 'bn' ? 'গর্ভাবস্থা' : 'Pregnancy'}</p>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{user.language === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings'}</p>
          
          {/* Personal Info */}
          <button 
            onClick={() => setActiveSection('profile')}
            className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
              <User size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-gray-900 tracking-tight">{user.language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Info'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.language === 'bn' ? 'নাম, ফোন, প্রসবের তারিখ' : 'Name, Phone, Due Date'}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Health Info */}
          <button 
            onClick={() => setActiveSection('health')}
            className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-105 transition-transform">
              <Heart size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-gray-900 tracking-tight">{user.language === 'bn' ? 'স্বাস্থ্য তথ্য' : 'Health Info'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.language === 'bn' ? 'বয়স, ওজন, রক্তের গ্রুপ' : 'Age, Weight, Blood Group'}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Emergency Contact */}
          <button 
            onClick={() => setActiveSection('emergency')}
            className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
              <AlertCircle size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-gray-900 tracking-tight">{user.language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{emergencyContactName || (user.language === 'bn' ? 'সেট করা হয়নি' : 'Not Set')}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Security & PIN */}
          <button 
            onClick={() => setActiveSection('settings')}
            className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
              <Shield size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-gray-900 tracking-tight">{user.language === 'bn' ? 'নিরাপত্তা ও পিন' : 'Security & PIN'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.language === 'bn' ? 'পিন পরিবর্তন করুন' : 'Change your PIN'}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Language Toggle */}
        <div className="pt-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3">{user.language === 'bn' ? 'ভাষা' : 'Language'}</p>
          <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLanguageSwitch('en')}
                className={`py-3.5 rounded-xl text-sm font-black transition-all ${
                  user.language === 'en' 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                🇺🇸 English
              </button>
              <button
                onClick={() => handleLanguageSwitch('bn')}
                className={`py-3.5 rounded-xl text-sm font-black transition-all ${
                  user.language === 'bn' 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                🇧🇩 বাংলা
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-3">
          {canInstall && onInstall && (
            <button 
              onClick={onInstall}
              className="w-full p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl shadow-lg shadow-pink-200 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Download size={22} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black tracking-tight">{t.installApp}</p>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">PWA Version</p>
              </div>
              <Sparkles size={18} className="opacity-60" />
            </button>
          )}

          <button 
            onClick={onLogout}
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
              <LogOut size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-gray-900 tracking-tight">{user.language === 'bn' ? 'সাইন আউট' : 'Sign Out'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user.language === 'bn' ? 'এই ডিভাইস থেকে লগআউট' : 'Logout from this device'}</p>
            </div>
          </button>

          <button 
            onClick={async () => {
              if (window.confirm(user.language === 'bn' ? 'আপনি কি নিশ্চিত? এটি আপনার সব ডেটা মুছে ফেলবে।' : 'Are you sure? This will delete all your data.')) {
                try {
                  const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                  if (!error) onLogout();
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            className="w-full py-4 text-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            <span className="text-xs font-black uppercase tracking-widest">{user.language === 'bn' ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-6">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Maa Care • v2.1.0</p>
        </div>
      </div>

      {/* Section Modals */}
      <SectionModal 
        isOpen={activeSection === 'profile'} 
        onClose={() => setActiveSection(null)}
        title={user.language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Info'}
        icon={<User size={20} />}
      >
        <div className="space-y-4">
          <InputField
            label={user.language === 'bn' ? 'আপনার নাম' : 'Your Name'}
            value={name}
            onChange={setName}
            placeholder="Enter your name"
            icon={<User size={16} />}
          />
          <InputField
            label={user.language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
            value={phoneNumber}
            onChange={setPhoneNumber}
            type="tel"
            placeholder="017XXXXXXXX"
            icon={<Phone size={16} />}
          />
          <InputField
            label={user.language === 'bn' ? 'প্রসবের সম্ভাব্য তারিখ' : 'Due Date'}
            value={dueDate}
            onChange={setDueDate}
            type="date"
            icon={<Calendar size={16} />}
          />
        </div>
      </SectionModal>

      <SectionModal 
        isOpen={activeSection === 'health'} 
        onClose={() => setActiveSection(null)}
        title={user.language === 'bn' ? 'স্বাস্থ্য তথ্য' : 'Health Info'}
        icon={<Heart size={20} />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={user.language === 'bn' ? 'বয়স' : 'Age'}
              value={age}
              onChange={setAge}
              type="number"
              placeholder="25"
            />
            <InputField
              label={user.language === 'bn' ? 'ওজন (kg)' : 'Weight (kg)'}
              value={weight}
              onChange={setWeight}
              type="number"
              placeholder="55"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{user.language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</label>
            <div className="grid grid-cols-4 gap-2">
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBloodGroup(bg)}
                  className={`py-3 rounded-xl text-sm font-black transition-all ${
                    bloodGroup === bg 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{user.language === 'bn' ? 'কততম গর্ভাবস্থা' : 'Pregnancy Number'}</label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '4'].map((pn) => (
                <button
                  key={pn}
                  onClick={() => setPregnancyNumber(pn)}
                  className={`py-3 rounded-xl text-sm font-black transition-all ${
                    pregnancyNumber === pn 
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pn}{pn === '1' ? 'st' : pn === '2' ? 'nd' : pn === '3' ? 'rd' : 'th+'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionModal>

      <SectionModal 
        isOpen={activeSection === 'emergency'} 
        onClose={() => setActiveSection(null)}
        title={user.language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}
        icon={<AlertCircle size={20} />}
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs font-bold text-red-600 leading-relaxed">
              {user.language === 'bn' 
                ? 'জরুরি পরিস্থিতিতে এই ব্যক্তির সাথে যোগাযোগ করা হবে। অনুগ্রহ করে একজন বিশ্বস্ত ব্যক্তির তথ্য দিন।'
                : 'This person will be contacted in emergencies. Please provide details of someone you trust.'}
            </p>
          </div>
          <InputField
            label={user.language === 'bn' ? 'যোগাযোগের নাম' : 'Contact Name'}
            value={emergencyContactName}
            onChange={setEmergencyContactName}
            placeholder={user.language === 'bn' ? 'স্বামী, মা, বাবা...' : 'Husband, Mother, Father...'}
            icon={<User size={16} />}
          />
          <InputField
            label={user.language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
            value={emergencyContactPhone}
            onChange={setEmergencyContactPhone}
            type="tel"
            placeholder="017XXXXXXXX"
            icon={<Phone size={16} />}
          />
        </div>
      </SectionModal>

      {/* Security PIN Modal - Custom Implementation */}
      {activeSection === 'settings' && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => { 
            if (e.target === e.currentTarget) {
              setActiveSection(null);
              setPinStep('old');
              setOldPinInput('');
              setNewPinInput('');
              setConfirmPinInput('');
              setPinError('');
              setPinSuccess(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                  <Shield size={20} />
                </div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  {user.language === 'bn' ? 'পিন পরিবর্তন' : 'Change PIN'}
                </h2>
              </div>
              <button 
                onClick={() => {
                  setActiveSection(null);
                  setPinStep('old');
                  setOldPinInput('');
                  setNewPinInput('');
                  setConfirmPinInput('');
                  setPinError('');
                  setPinSuccess(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"
              >
                <ChevronRight size={20} className="rotate-90" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['old', 'new', 'confirm'].map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    pinStep === step ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 scale-110' :
                    (pinStep === 'new' && idx === 0) || (pinStep === 'confirm' && idx <= 1) ? 'bg-green-500 text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {(pinStep === 'new' && idx === 0) || (pinStep === 'confirm' && idx <= 1) ? '✓' : idx + 1}
                  </div>
                  {idx < 2 && <div className={`w-8 h-1 rounded-full transition-all ${
                    (pinStep === 'new' && idx === 0) || (pinStep === 'confirm') ? 'bg-green-500' : 'bg-gray-100'
                  }`} />}
                </div>
              ))}
            </div>

            {/* Success State */}
            {pinSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900">
                  {user.language === 'bn' ? 'পিন পরিবর্তন সফল!' : 'PIN Changed!'}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {user.language === 'bn' ? 'আপনার নতুন পিন সফলভাবে সংরক্ষিত হয়েছে।' : 'Your new PIN has been saved successfully.'}
                </p>
                <button
                  onClick={() => {
                    setActiveSection(null);
                    setPinStep('old');
                    setOldPinInput('');
                    setNewPinInput('');
                    setConfirmPinInput('');
                    setPinError('');
                    setPinSuccess(false);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-200 active:scale-[0.98] transition-all"
                >
                  {user.language === 'bn' ? 'সম্পন্ন' : 'Done'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step Instructions */}
                <div className={`p-4 rounded-xl border ${
                  pinStep === 'old' ? 'bg-amber-50 border-amber-100' :
                  pinStep === 'new' ? 'bg-indigo-50 border-indigo-100' :
                  'bg-green-50 border-green-100'
                }`}>
                  <p className={`text-xs font-bold leading-relaxed ${
                    pinStep === 'old' ? 'text-amber-700' :
                    pinStep === 'new' ? 'text-indigo-700' :
                    'text-green-700'
                  }`}>
                    {pinStep === 'old' && (user.language === 'bn' 
                      ? 'প্রথমে আপনার বর্তমান ৪-সংখ্যার পিন লিখুন।' 
                      : 'First, enter your current 4-digit PIN.')}
                    {pinStep === 'new' && (user.language === 'bn' 
                      ? 'এখন আপনার নতুন ৪-সংখ্যার পিন লিখুন।' 
                      : 'Now, enter your new 4-digit PIN.')}
                    {pinStep === 'confirm' && (user.language === 'bn' 
                      ? 'নিশ্চিত করতে আবার নতুন পিন লিখুন।' 
                      : 'Re-enter your new PIN to confirm.')}
                  </p>
                </div>

                {/* Step Label */}
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block text-center">
                  {pinStep === 'old' && (user.language === 'bn' ? 'বর্তমান পিন' : 'Current PIN')}
                  {pinStep === 'new' && (user.language === 'bn' ? 'নতুন পিন' : 'New PIN')}
                  {pinStep === 'confirm' && (user.language === 'bn' ? 'নতুন পিন নিশ্চিত করুন' : 'Confirm New PIN')}
                </label>

                {/* PIN Display */}
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => {
                    const currentPin = pinStep === 'old' ? oldPinInput : pinStep === 'new' ? newPinInput : confirmPinInput;
                    return (
                      <div 
                        key={i}
                        className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-200 ${
                          currentPin.length === i ? `${
                            pinStep === 'old' ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-100' :
                            pinStep === 'new' ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' :
                            'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                          } scale-110` : 
                          currentPin.length > i ? `${
                            pinStep === 'old' ? 'border-amber-200 bg-amber-50 text-amber-600' :
                            pinStep === 'new' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' :
                            'border-green-200 bg-green-50 text-green-600'
                          }` : 
                          'border-gray-200 bg-gray-50 text-gray-300'
                        }`}
                      >
                        {currentPin[i] ? (showPin ? currentPin[i] : '●') : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Error Message */}
                {pinError && (
                  <div className="text-center">
                    <p className="text-sm font-bold text-red-500 animate-in shake">{pinError}</p>
                  </div>
                )}

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPinError('');
                        if (pinStep === 'old') {
                          if (num === 'del') setOldPinInput(oldPinInput.slice(0, -1));
                          else if (num !== null && oldPinInput.length < 4) {
                            const newVal = oldPinInput + num;
                            setOldPinInput(newVal);
                            // Auto-advance when 4 digits entered
                            if (newVal.length === 4) {
                              if (newVal === pin) {
                                setTimeout(() => setPinStep('new'), 300);
                              } else {
                                setPinError(user.language === 'bn' ? 'ভুল পিন! আবার চেষ্টা করুন।' : 'Wrong PIN! Try again.');
                                setTimeout(() => setOldPinInput(''), 500);
                              }
                            }
                          }
                        } else if (pinStep === 'new') {
                          if (num === 'del') setNewPinInput(newPinInput.slice(0, -1));
                          else if (num !== null && newPinInput.length < 4) {
                            const newVal = newPinInput + num;
                            setNewPinInput(newVal);
                            if (newVal.length === 4) {
                              setTimeout(() => setPinStep('confirm'), 300);
                            }
                          }
                        } else if (pinStep === 'confirm') {
                          if (num === 'del') setConfirmPinInput(confirmPinInput.slice(0, -1));
                          else if (num !== null && confirmPinInput.length < 4) {
                            const newVal = confirmPinInput + num;
                            setConfirmPinInput(newVal);
                            if (newVal.length === 4) {
                              if (newVal === newPinInput) {
                                // Save new PIN
                                setPin(newPinInput);
                                handleSave();
                                setPinSuccess(true);
                              } else {
                                setPinError(user.language === 'bn' ? 'পিন মিলছে না! আবার চেষ্টা করুন।' : 'PINs do not match! Try again.');
                                setTimeout(() => {
                                  setConfirmPinInput('');
                                  setNewPinInput('');
                                  setPinStep('new');
                                }, 500);
                              }
                            }
                          }
                        }
                      }}
                      disabled={num === null}
                      className={`py-4 rounded-xl text-xl font-black transition-all ${
                        num === null ? 'invisible' :
                        num === 'del' ? 'bg-red-50 text-red-500 active:bg-red-100' :
                        'bg-gray-100 text-gray-700 active:bg-pink-100 active:text-pink-600'
                      }`}
                    >
                      {num === 'del' ? '⌫' : num}
                    </button>
                  ))}
                </div>

                {/* Show/Hide PIN Toggle */}
                <button 
                  onClick={() => setShowPin(!showPin)}
                  className="w-full py-3 text-xs font-black text-gray-500 uppercase tracking-widest"
                >
                  {showPin ? (user.language === 'bn' ? '🔒 পিন লুকান' : '🔒 Hide PIN') : (user.language === 'bn' ? '👁 পিন দেখুন' : '👁 Show PIN')}
                </button>

                {/* Back Button (for new/confirm steps) */}
                {pinStep !== 'old' && (
                  <button 
                    onClick={() => {
                      if (pinStep === 'new') {
                        setPinStep('old');
                        setOldPinInput('');
                      } else if (pinStep === 'confirm') {
                        setPinStep('new');
                        setNewPinInput('');
                        setConfirmPinInput('');
                      }
                      setPinError('');
                    }}
                    className="w-full py-3 text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={14} />
                    {user.language === 'bn' ? 'পেছনে যান' : 'Go Back'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;

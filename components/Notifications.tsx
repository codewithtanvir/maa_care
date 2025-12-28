
import React, { useState, useEffect } from 'react';
import { Notification, Language, View, UserProfile } from '../types';
import { Bell, BellOff, Check, Trash2, ArrowLeft, Loader2, Calendar, Info, AlertCircle, Clock, Plus, X, Sparkles, Heart, RefreshCw, Lightbulb, Apple, Droplets, Moon, Footprints } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';
import { getDashboardInsight } from '../services/geminiService';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

interface DailyTip {
  id: string;
  category: 'ai' | 'health' | 'nutrition' | 'sleep' | 'exercise';
  title: string;
  content: string;
  icon: any;
  color: string;
  bgColor: string;
}

const Notifications: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language;
  const t = translations[language || 'en'] || translations.en;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [activeTab, setActiveTab] = useState<'tips' | 'reminders'>('tips');
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [loadingTips, setLoadingTips] = useState(true);
  const [aiTip, setAiTip] = useState<string>('');
  const [loadingAiTip, setLoadingAiTip] = useState(false);

  const healthTipsEn = [
    { category: 'nutrition', title: 'Stay Hydrated', content: 'Drink at least 8-10 glasses of water daily. Add lemon or cucumber for a refreshing twist!', icon: Droplets, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'nutrition', title: 'Iron-Rich Foods', content: 'Include spinach, lentils, and lean meats to prevent anemia during pregnancy.', icon: Apple, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { category: 'sleep', title: 'Quality Sleep', content: 'Sleep on your left side to improve blood flow to your baby. Use pillows for support.', icon: Moon, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'exercise', title: 'Gentle Movement', content: 'A 20-30 minute walk daily helps reduce swelling and improves mood.', icon: Footprints, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { category: 'health', title: 'Prenatal Vitamins', content: 'Take your prenatal vitamins consistently, especially folic acid in the first trimester.', icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { category: 'nutrition', title: 'Protein Power', content: 'Aim for 70-100g of protein daily from fish, eggs, dairy, and legumes.', icon: Apple, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'health', title: 'Monitor Movement', content: 'After week 28, track baby kicks daily. 10 movements in 2 hours is healthy.', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'sleep', title: 'Relaxation Time', content: 'Practice deep breathing or prenatal yoga to reduce stress and anxiety.', icon: Moon, color: 'text-rose-500', bgColor: 'bg-rose-50' },
  ];

  const healthTipsBn = [
    { category: 'nutrition', title: 'পানি পান করুন', content: 'প্রতিদিন কমপক্ষে ৮-১০ গ্লাস পানি পান করুন। সতেজতার জন্য লেবু বা শসা যোগ করতে পারেন!', icon: Droplets, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'nutrition', title: 'আয়রন সমৃদ্ধ খাবার', content: 'গর্ভাবস্থায় রক্তস্বল্পতা রোধে পালং শাক, ডাল এবং মাছ খান।', icon: Apple, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { category: 'sleep', title: 'ভালো ঘুম', content: 'বাম পাশে শুয়ে ঘুমান - এতে শিশুর রক্ত সঞ্চালন ভালো হয়। বালিশ ব্যবহার করুন।', icon: Moon, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'exercise', title: 'হালকা ব্যায়াম', content: 'প্রতিদিন ২০-৩০ মিনিট হাঁটা ফোলাভাব কমায় এবং মন ভালো রাখে।', icon: Footprints, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { category: 'health', title: 'প্রিনাটাল ভিটামিন', content: 'নিয়মিত প্রিনাটাল ভিটামিন খান, বিশেষ করে প্রথম ত্রৈমাসিকে ফলিক অ্যাসিড।', icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { category: 'nutrition', title: 'প্রোটিন', content: 'প্রতিদিন মাছ, ডিম, দুধ এবং ডাল থেকে ৭০-১০০ গ্রাম প্রোটিন নিন।', icon: Apple, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'health', title: 'বাচ্চার নড়াচড়া', content: '২৮ সপ্তাহ পর প্রতিদিন বাচ্চার লাথি গণনা করুন। ২ ঘণ্টায় ১০টি নড়াচড়া স্বাভাবিক।', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { category: 'sleep', title: 'শিথিলতা', content: 'মানসিক চাপ কমাতে গভীর শ্বাস-প্রশ্বাস বা প্রিনাটাল যোগব্যায়াম করুন।', icon: Moon, color: 'text-rose-500', bgColor: 'bg-rose-50' },
  ];

  const getRandomTips = () => {
    const tips = language === 'bn' ? healthTipsBn : healthTipsEn;
    const shuffled = [...tips].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4).map((tip, index) => ({
      ...tip,
      id: `tip-${index}-${Date.now()}`
    })) as DailyTip[];
  };

  const fetchAITip = async (force = false) => {
    if (!user?.id) return;
    
    const cacheKey = `notification_ai_tip_${user.id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!force && cached) {
      try {
        const { text, timestamp } = JSON.parse(cached);
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - timestamp < oneHour) {
          setAiTip(text);
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached AI tip", e);
      }
    }

    setLoadingAiTip(true);
    try {
      const { data: logs } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const tip = await getDashboardInsight(user, logs || []);
      if (tip) {
        setAiTip(tip);
        localStorage.setItem(cacheKey, JSON.stringify({ text: tip, timestamp: Date.now() }));
      }
    } catch (e) {
      console.error("AI tip error:", e);
    } finally {
      setLoadingAiTip(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    setDailyTips(getRandomTips());
    fetchAITip();
    setLoadingTips(false);
  }, [user.id, language]);

  const fetchNotifications = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setNotifications(data.map(d => ({
          id: d.id,
          title: d.title,
          body: d.body,
          type: d.type,
          is_read: d.is_read,
          created_at: d.created_at,
          scheduled_for: d.scheduled_for
        })));
      }
    } catch (e) {
      console.error("Error fetching notifications", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderTitle || !newReminderTime || !user.id) return;
    
    try {
      // Create a timestamp for today at the selected time
      const [hours, minutes] = newReminderTime.split(':');
      const scheduledDate = new Date();
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: newReminderTitle,
          body: `${t.reminders}: ${newReminderTime}`,
          type: 'reminder',
          is_read: false,
          scheduled_for: scheduledDate.toISOString()
        }])
        .select();

      if (data) {
        fetchNotifications();
        setNewReminderTitle('');
        setNewReminderTime('');
        setShowAddReminder(false);
      }
    } catch (e) {
      console.error("Error adding reminder", e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (e) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return Clock;
      case 'alert': return AlertCircle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder': return 'text-blue-500 bg-blue-50';
      case 'alert': return 'text-red-500 bg-red-50';
      case 'info': return 'text-teal-500 bg-teal-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-black ml-2 text-gray-900">{t.notifications}</h1>
          </div>
          {activeTab === 'reminders' && (
            <button 
              onClick={() => setShowAddReminder(true)}
              className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-lg shadow-pink-200 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'tips' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Lightbulb size={16} />
              {language === 'bn' ? 'দৈনিক টিপস' : 'Daily Tips'}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'reminders' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell size={16} />
              {language === 'bn' ? 'রিমাইন্ডার' : 'Reminders'}
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'tips' ? (
          <>
            {/* AI Personalized Tip */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 shadow-xl shadow-violet-200">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-black text-white text-sm">{language === 'bn' ? 'আজকের AI টিপ' : "Today's AI Tip"}</h3>
                      <p className="text-[10px] text-violet-200 font-bold uppercase tracking-widest">Maa Care AI</p>
                    </div>
                    <button 
                      onClick={() => fetchAITip(true)}
                      disabled={loadingAiTip}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={`text-white ${loadingAiTip ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {loadingAiTip ? (
                    <div className="space-y-2">
                      <div className="h-3 bg-white/20 rounded-full w-full animate-pulse" />
                      <div className="h-3 bg-white/20 rounded-full w-4/5 animate-pulse" />
                    </div>
                  ) : (
                    <p className="text-white/90 text-sm leading-relaxed">
                      {aiTip || (language === 'bn' ? 'আপনার জন্য ব্যক্তিগত টিপ তৈরি হচ্ছে...' : 'Generating your personalized tip...')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Health Tips Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Heart size={16} className="text-pink-500" />
                  {language === 'bn' ? 'স্বাস্থ্য টিপস' : 'Health Tips'}
                </h3>
                <button 
                  onClick={() => setDailyTips(getRandomTips())}
                  className="text-xs font-bold text-pink-500 flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  {language === 'bn' ? 'নতুন' : 'Refresh'}
                </button>
              </div>
              
              <div className="space-y-3">
                {dailyTips.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div 
                      key={tip.id}
                      className="bg-white p-4 rounded-2xl shadow-md shadow-slate-100 border border-slate-100"
                    >
                      <div className="flex gap-3">
                        <div className={`w-11 h-11 ${tip.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                          <Icon size={22} className={tip.color} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">{tip.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tip.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Week-Specific Tip */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Lightbulb size={20} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">
                    {language === 'bn' ? `সপ্তাহ ${user.currentWeek || 1} টিপ` : `Week ${user.currentWeek || 1} Tip`}
                  </h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    {(user.currentWeek || 1) <= 12 
                      ? (language === 'bn' 
                          ? 'প্রথম ত্রৈমাসিকে বমি বমি ভাব হলে অল্প অল্প করে বারবার খান। আদা চা সাহায্য করতে পারে।'
                          : 'If experiencing nausea in first trimester, eat small frequent meals. Ginger tea may help.')
                      : (user.currentWeek || 1) <= 26
                        ? (language === 'bn'
                            ? 'দ্বিতীয় ত্রৈমাসিকে শক্তি ফিরে আসে। এখন হালকা ব্যায়াম শুরু করার ভালো সময়।'
                            : 'Energy returns in second trimester. Good time to start light exercises.')
                        : (language === 'bn'
                            ? 'তৃতীয় ত্রৈমাসিকে বিশ্রাম নিন। বাচ্চার লাথি গণনা করুন এবং হাসপাতালের ব্যাগ প্রস্তুত রাখুন।'
                            : 'Rest well in third trimester. Count baby kicks and keep hospital bag ready.')}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {showAddReminder && (
              <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-pink-100 mb-4 animate-in slide-in-from-top duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">{t.addReminder}</h3>
                  <button onClick={() => setShowAddReminder(false)} className="text-gray-400">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder={t.reminderTitle}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pink-200"
                    value={newReminderTitle}
                    onChange={(e) => setNewReminderTitle(e.target.value)}
                  />
                  <input 
                    type="time" 
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pink-200"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                  />
                  <button 
                    onClick={handleAddReminder}
                    className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <BellOff className="w-16 h-16 mb-4 opacity-20" />
                <p>{t.noNotifications}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => {
                  const Icon = getTypeIcon(n.type);
                  return (
                    <div 
                      key={n.id} 
                      className={`bg-white p-4 rounded-2xl shadow-sm border transition-all ${
                        n.is_read ? 'border-gray-100 opacity-75' : 'border-pink-100 ring-1 ring-pink-50'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-xl shrink-0 ${getTypeColor(n.type)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className={`font-bold text-gray-900 ${n.is_read ? 'text-gray-600' : ''}`}>
                              {n.title}
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            {n.body}
                          </p>
                          <div className="flex gap-3 mt-4">
                            {!n.is_read && (
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="text-xs font-black text-pink-600 uppercase tracking-widest flex items-center gap-1 hover:text-pink-700"
                              >
                                <Check size={14} />
                                {t.markAsRead}
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(n.id)}
                              className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                              {t.delete}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;

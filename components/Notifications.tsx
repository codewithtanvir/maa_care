
import React, { useState, useEffect } from 'react';
import { Notification, Language, View, UserProfile } from '../types';
import { Bell, BellOff, Check, Trash2, ArrowLeft, Loader2, Calendar, Info, AlertCircle, Clock, Plus, X } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const Notifications: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language;
  const t = translations[language || 'en'] || translations.en;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [user.id]);

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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold ml-2 text-gray-800">{t.notifications}</h1>
        </div>
        <button 
          onClick={() => setShowAddReminder(true)}
          className="p-2 bg-pink-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          notifications.map((n) => {
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
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;

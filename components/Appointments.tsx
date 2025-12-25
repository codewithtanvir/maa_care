
import React, { useState, useEffect } from 'react';
import { UserProfile, Appointment } from '../types';
import { Calendar, Plus, Trash2, Clock, MapPin, X, ArrowLeft, Loader2 } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const Appointments: React.FC<Props> = ({ user, onBack }) => {
  const t = translations[user?.language || 'en'] || translations.en;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddApp, setShowAddApp] = useState(false);
  
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newAppDate, setNewAppDate] = useState('');
  const [newAppTime, setNewAppTime] = useState('');
  const [newAppLoc, setNewAppLoc] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [user.id]);

  const fetchAppointments = async () => {
    if (!user.id) return;
    setIsLoading(true);
    setAppointments([]); // Clear previous appointments to prevent flicker between accounts
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (data) {
        setAppointments(data.map(a => ({
          id: a.id,
          title: a.title,
          date: a.date,
          time: a.time,
          location: a.location
        })));
      }
    } catch (e) {
      console.error("Error fetching appointments", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAppointment = async () => {
    if (!newAppTitle || !newAppDate || !user.id) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id,
          title: newAppTitle,
          date: newAppDate,
          time: newAppTime,
          location: newAppLoc
        }])
        .select();

      if (error) {
        console.error("Error adding appointment:", error);
        alert(user.language === 'bn' 
          ? 'অ্যাপয়েন্টমেন্ট যোগ করতে ব্যর্থ। আবার লগইন করুন।'
          : 'Failed to add appointment. Please login again.');
        return;
      }

      if (data) {
        setAppointments([...appointments, {
          id: data[0].id,
          title: newAppTitle,
          date: newAppDate,
          time: newAppTime,
          location: newAppLoc
        }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        
        setNewAppTitle('');
        setNewAppDate('');
        setNewAppTime('');
        setNewAppLoc('');
        setShowAddApp(false);
      }
    } catch (e) {
      console.error("Error adding appointment", e);
      alert(user.language === 'bn' 
        ? 'অ্যাপয়েন্টমেন্ট যোগ করতে ব্যর্থ। আবার চেষ্টা করুন।'
        : 'Failed to add appointment. Please try again.');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!user.id) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        setAppointments(appointments.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error("Error deleting appointment", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-6 flex items-center gap-4 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <button onClick={onBack} className="p-3 hover:bg-rose-50 rounded-2xl transition-all text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{t.appointments}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-6">
        {/* Add Button */}
        {!showAddApp && (
          <button 
            onClick={() => setShowAddApp(true)}
            className="w-full py-4 px-8 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-rose-100 active:scale-95 transition-all"
          >
            <Plus size={18} />
            {t.addAppointment}
          </button>
        )}

        {/* Add Form */}
        {showAddApp && (
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-rose-50 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 tracking-tight">{t.addAppointment}</h3>
              <button onClick={() => setShowAddApp(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">{t.appointmentTitle}</label>
                <input 
                  type="text" 
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-700"
                  placeholder="e.g. Ultrasound"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">{t.appointmentDate}</label>
                  <input 
                    type="date" 
                    value={newAppDate}
                    onChange={(e) => setNewAppDate(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">{t.appointmentTime}</label>
                  <input 
                    type="time" 
                    value={newAppTime}
                    onChange={(e) => setNewAppTime(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">{t.location}</label>
                <input 
                  type="text" 
                  value={newAppLoc}
                  onChange={(e) => setNewAppLoc(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 font-bold text-gray-700"
                  placeholder="Hospital name"
                />
              </div>
              <button 
                onClick={handleAddAppointment}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-100 active:scale-95 transition-all"
              >
                {t.save}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
            <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest">Loading...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
            <Calendar size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{t.noAppointments}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => (
              <div key={app.id} className="bg-white p-5 rounded-[2rem] border border-rose-50 shadow-sm hover:border-rose-200 hover:shadow-md transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-110 transition-transform">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 text-base tracking-tight">{app.title}</h4>
                      <p className="text-xs text-rose-500 uppercase font-black tracking-widest">{app.date}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteAppointment(app.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-50">
                  {app.time && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600">{app.time}</span>
                    </div>
                  )}
                  {app.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600">{app.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;

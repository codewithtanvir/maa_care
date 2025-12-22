
import React, { useState, useEffect } from 'react';
import { UserProfile, Appointment } from '../types';
import { Calendar, Plus, Trash2, Clock, MapPin, X, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
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
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (!error) {
        setAppointments(appointments.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error("Error deleting appointment", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t.appointments}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-4">
        {/* Add Button */}
        {!showAddApp && (
          <button 
            onClick={() => setShowAddApp(true)}
            className="w-full py-4 px-6 bg-rose-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t.addAppointment}
          </button>
        )}

        {/* Add Form */}
        {showAddApp && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">{t.addAppointment}</h3>
              <button onClick={() => setShowAddApp(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t.appointmentTitle}</label>
                <input 
                  type="text" 
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-rose-500"
                  placeholder="e.g. Ultrasound"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t.appointmentDate}</label>
                  <input 
                    type="date" 
                    value={newAppDate}
                    onChange={(e) => setNewAppDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t.appointmentTime}</label>
                  <input 
                    type="time" 
                    value={newAppTime}
                    onChange={(e) => setNewAppTime(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t.location}</label>
                <input 
                  type="text" 
                  value={newAppLoc}
                  onChange={(e) => setNewAppLoc(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-rose-500"
                  placeholder="Hospital name"
                />
              </div>
              <button 
                onClick={handleAddAppointment}
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold mt-2"
              >
                {t.save}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-2" />
            <p className="text-gray-500 text-sm">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">{t.noAppointments}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((app) => (
              <div key={app.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{app.title}</h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {app.date} {app.time}
                    </div>
                    {app.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {app.location}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteAppointment(app.id)}
                  className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;

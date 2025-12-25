
import React, { useState, useEffect } from 'react';
import { LogEntry, Language, View, UserProfile } from '../types';
import { Smile, Frown, Zap, Coffee, Ghost, ArrowLeft, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const MoodTracker: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language;
  const t = translations[language || 'en'] || translations.en;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMood, setSelectedMood] = useState<LogEntry['mood']>('happy');

  const moods: { type: LogEntry['mood']; icon: any; color: string; label: string; labelBn: string }[] = [
    { type: 'happy', icon: Smile, color: 'text-yellow-500', label: 'Happy', labelBn: 'খুশি' },
    { type: 'excited', icon: Zap, color: 'text-orange-500', label: 'Excited', labelBn: 'উত্তেজিত' },
    { type: 'tired', icon: Coffee, color: 'text-blue-500', label: 'Tired', labelBn: 'ক্লান্ত' },
    { type: 'anxious', icon: Ghost, color: 'text-purple-500', label: 'Anxious', labelBn: 'চিন্তিত' },
    { type: 'nauseous', icon: Frown, color: 'text-green-500', label: 'Nauseous', labelBn: 'অসুস্থ' },
  ];

  useEffect(() => {
    fetchMoodLogs();
  }, [user.id]);

  const fetchMoodLogs = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (data) {
        setLogs(data.map(d => ({
          id: d.id,
          date: d.date,
          mood: d.mood,
          symptoms: d.symptoms || [],
          notes: d.notes || '',
        } as LogEntry)));
      }
    } catch (e) {
      console.error("Error fetching mood logs", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMood = async () => {
    if (!user.id) return;
    setIsSaving(true);
    try {
      const newLog = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        symptoms: [],
        notes: 'Mood entry',
      };

      const { error } = await supabase
        .from('health_logs')
        .insert([newLog]);

      if (error) throw error;
      
      fetchMoodLogs();
      alert(t.moodSaved);
    } catch (e) {
      console.error("Error saving mood", e);
    } finally {
      setIsSaving(false);
    }
  };

  const getMoodIcon = (moodType: string) => {
    const mood = moods.find(m => m.type === moodType);
    if (!mood) return Smile;
    return mood.icon;
  };

  const getMoodColor = (moodType: string) => {
    const mood = moods.find(m => m.type === moodType);
    if (!mood) return 'text-gray-500';
    return mood.color;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-800">{t.moodTracker}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Mood Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{t.howIsMood}</h2>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m) => (
              <button
                key={m.type}
                onClick={() => setSelectedMood(m.type)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  selectedMood === m.type 
                    ? 'bg-pink-50 border-2 border-pink-200 scale-105' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <m.icon className={`w-8 h-8 mb-1 ${m.color}`} />
                <span className="text-xs font-medium text-gray-600">
                  {language === 'bn' ? m.labelBn : m.label}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveMood}
            disabled={isSaving}
            className="w-full mt-6 bg-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t.save}
          </button>
        </div>

        {/* Mood History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
              {t.moodHistory}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
              <p className="text-gray-500">{t.noHistory}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const MoodIcon = getMoodIcon(log.mood);
                return (
                  <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg bg-gray-50 mr-3`}>
                        <MoodIcon className={`w-6 h-6 ${getMoodColor(log.mood)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 capitalize">
                          {language === 'bn' 
                            ? moods.find(m => m.type === log.mood)?.labelBn 
                            : log.mood}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(log.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;

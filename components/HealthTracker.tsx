
import React, { useState, useEffect, useMemo } from 'react';
import { LogEntry, Language, View, UserProfile } from '../types';
import { Plus, Clipboard, Smile, Frown, Zap, Coffee, Ghost, Sparkles, Trash2, X, Stethoscope, Lightbulb, ArrowLeft, Loader2 } from 'lucide-react';
import { getHealthInsight } from '../services/geminiService';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onNavigate: (view: View) => void;
  onBack: () => void;
}

const HealthTracker: React.FC<Props> = ({ user, onNavigate, onBack }) => {
  const language = user.language;
  const t = translations[language || 'en'] || translations.en;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // New Log Form State
  const [weight, setWeight] = useState('');
  const [mood, setMood] = useState<LogEntry['mood']>('happy');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const symptomList = language === 'bn' 
    ? ['বমি বমি ভাব', 'পিঠে ব্যথা', 'ফোলাভাব', 'বুক জ্বালাপোড়া', 'ক্লান্তি', 'মাথাব্যথা', 'খিঁচুনি', 'কোষ্ঠকাঠিন্য', 'অনিদ্রা', 'মাথা ঘোরা']
    : ['Nausea', 'Back Pain', 'Swelling', 'Heartburn', 'Fatigue', 'Headache', 'Cramps', 'Constipation', 'Insomnia', 'Dizziness'];

  // Suggest symptoms based on mood
  const suggestionsByMood = useMemo(() => {
    const map: Record<string, string[]> = language === 'bn' ? {
      happy: ['অতিরিক্ত শক্তি', 'উজ্জ্বল ত্বক'],
      tired: ['ক্লান্তি', 'পিঠে ব্যথা', 'অনিদ্রা'],
      anxious: ['বুক ধড়ফড়ানি', 'অস্থিরতা', 'নিশ্বাসের স্বল্পতা'],
      excited: ['ক্ষুধা বৃদ্ধি', 'উত্তেজনা'],
      nauseous: ['বমি বমি ভাব', 'বমি', 'মাথা ঘোরা', 'গন্ধ অসহ্য লাগা']
    } : {
      happy: ['Energy Boost', 'Glowing Skin'],
      tired: ['Fatigue', 'Back Pain', 'Insomnia'],
      anxious: ['Heart palpitations', 'Restlessness', 'Shortness of breath'],
      excited: ['Increased appetite', 'Nesting instinct'],
      nauseous: ['Nausea', 'Vomiting', 'Dizziness', 'Aversion to smells']
    };
    return map[mood] || [];
  }, [mood, language]);

  // Suggest symptoms based on recent entries (last 3 logs)
  const suggestionsByHistory = useMemo(() => {
    const recentSymptoms = logs.slice(0, 3).flatMap(l => l.symptoms);
    const uniqueRecent = Array.from(new Set(recentSymptoms));
    return uniqueRecent.filter(s => !suggestionsByMood.includes(s));
  }, [logs, suggestionsByMood]);

  const allSuggestions = Array.from(new Set([...suggestionsByMood, ...suggestionsByHistory])).slice(0, 5);

  useEffect(() => {
    fetchLogs();
  }, [user.id]);

  const fetchLogs = async () => {
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
          weight: d.weight,
          mood: d.mood,
          symptoms: d.symptoms,
          notes: d.notes
        })));
      }
    } catch (e) {
      console.error("Error fetching logs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (logs.length > 0) {
      fetchInsight();
    }
  }, [logs]);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await getHealthInsight(user, logs.slice(0, 3));
      setInsight(res || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleAddLog = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', user.phoneNumber)
        .single();

      if (!profile) return;

      const newLogData = {
        user_id: profile.id,
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(weight) || null,
        mood,
        symptoms,
        notes
      };

      const { data, error } = await supabase
        .from('health_logs')
        .insert(newLogData)
        .select()
        .single();

      if (data) {
        const newLog: LogEntry = {
          id: data.id,
          date: data.date,
          weight: data.weight,
          mood: data.mood,
          symptoms: data.symptoms,
          notes: data.notes
        };
        setLogs([newLog, ...logs]);
        setIsAdding(false);
        resetForm();
      }
    } catch (e) {
      console.error("Error adding log", e);
    }
  };

  const resetForm = () => {
    setWeight('');
    setMood('happy');
    setSymptoms([]);
    setNotes('');
  };

  const deleteLog = async (id: string) => {
    const confirmed = window.confirm(language === 'bn' ? 'আপনি কি এই এন্ট্রিটি মুছতে চান?' : 'Are you sure you want to delete this log entry?');
    if (confirmed) {
      try {
        const { error } = await supabase
          .from('health_logs')
          .delete()
          .eq('id', id);

        if (!error) {
          setLogs(logs.filter(l => l.id !== id));
        }
      } catch (e) {
        console.error("Error deleting log", e);
      }
    }
  };

  const toggleSymptom = (s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const moodIcons = {
    happy: <Smile className="text-yellow-500" />,
    tired: <Coffee className="text-blue-500" />,
    anxious: <Ghost className="text-purple-500" />,
    excited: <Zap className="text-orange-500" />,
    nauseous: <Frown className="text-green-500" />
  };

  const moodNames = {
    happy: language === 'bn' ? 'খুশি' : 'Happy',
    tired: language === 'bn' ? 'ক্লান্ত' : 'Tired',
    anxious: language === 'bn' ? 'উদ্বিগ্ন' : 'Anxious',
    excited: language === 'bn' ? 'উত্তেজিত' : 'Excited',
    nauseous: language === 'bn' ? 'বমি বমি ভাব' : 'Nauseous'
  };

  return (
    <div className="p-6 space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-pink-50 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{t.healthLog}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate(View.SYMPTOM_CHECKER)}
            className="bg-indigo-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-all"
            title={t.symptomChecker}
          >
            <Stethoscope size={24} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-pink-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* AI Insight Card */}
      {logs.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles size={64} />
          </div>
          <h3 className="font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Sparkles size={18} /> Maa Care AI {language === 'bn' ? 'স্বাস্থ্য পরামর্শ' : 'Health Check'}
          </h3>
          {loadingInsight ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-white/20 rounded-full w-3/4" />
              <div className="h-4 bg-white/20 rounded-full w-1/2" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed font-medium">
              {insight || (language === 'bn' ? "ব্যক্তিগত পরামর্শ পেতে আপনার স্বাস্থ্য লগ করতে থাকুন!" : "Keep logging your symptoms to get personalized advice!")}
            </p>
          )}
        </div>
      )}

      {/* Adding Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom duration-300 safe-area-bottom">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{t.newEntry}</h2>
              <button onClick={() => setIsAdding(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[70vh] space-y-6 pb-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t.weight} (kg/lbs)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t.feeling}</label>
                <div className="flex justify-around bg-gray-50 p-2 rounded-xl">
                  {(Object.keys(moodIcons) as Array<keyof typeof moodIcons>).map((m) => (
                    <button 
                      key={m}
                      onClick={() => setMood(m)}
                      className={`p-2.5 rounded-lg transition-all ${mood === m ? 'bg-white shadow-sm scale-110' : 'opacity-40'}`}
                    >
                      {moodIcons[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Symptom Suggestions */}
              {allSuggestions.length > 0 && (
                <div className="animate-in fade-in duration-500">
                  <label className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Lightbulb size={12} /> {t.suggested}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allSuggestions.map(s => (
                      <button 
                        key={`suggest-${s}`}
                        onClick={() => toggleSymptom(s)}
                        className={`px-3 py-2 rounded-full text-[10px] font-bold transition-all border uppercase tracking-tighter flex items-center gap-1.5 ${
                          symptoms.includes(s) ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-100' : 'bg-pink-50/50 text-pink-600 border-pink-100 hover:bg-pink-100'
                        }`}
                      >
                        {s} {symptoms.includes(s) && <X size={10} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t.symptoms}</label>
                <div className="flex flex-wrap gap-2">
                  {symptomList.map(s => (
                    <button 
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={`px-3 py-2 rounded-full text-[10px] font-bold transition-all border uppercase tracking-tighter ${
                        symptoms.includes(s) ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-100' : 'bg-white text-gray-400 border-gray-100 hover:border-pink-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <textarea 
                placeholder={t.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 h-24 text-sm focus:ring-2 focus:ring-pink-400 focus:outline-none"
              />

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleAddLog}
                  className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-100"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-700">{t.history}</h3>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
            <Loader2 className="animate-spin text-pink-500" size={32} />
            <p className="text-sm font-medium">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading history...'}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clipboard size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm italic">{t.noHistory}</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-5 rounded-2xl border border-pink-50 shadow-sm group hover:border-pink-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
                    {moodIcons[log.mood]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{log.date}</h4>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{moodNames[log.mood]}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteLog(log.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {log.symptoms.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] rounded font-bold uppercase tracking-tight">{s}</span>
                ))}
              </div>
              {log.notes && <p className="text-xs text-gray-600 border-t border-gray-50 pt-3 italic">"{log.notes}"</p>}
              {log.weight && <p className="text-[10px] text-gray-400 mt-2 font-bold">{t.weight}: {log.weight} kg</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HealthTracker;


import React, { useState, useEffect, useMemo } from 'react';
import { LogEntry, Language, View, UserProfile } from '../types';
import { Plus, Clipboard, Smile, Frown, Zap, Coffee, Ghost, Sparkles, Trash2, X, Stethoscope, Lightbulb, ArrowLeft, Loader2, Baby, ChevronRight } from 'lucide-react';
import { getHealthInsight, getBabyDevelopmentInfo } from '../services/geminiService';
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
  const [activeTab, setActiveTab] = useState<'logs' | 'baby'>('logs');
  const [babyInfo, setBabyInfo] = useState<string | null>(null);
  const [loadingBaby, setLoadingBaby] = useState(false);

  // New Log Form State
  const [weight, setWeight] = useState('');
  const [mood, setMood] = useState<LogEntry['mood']>('happy');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [glucose, setGlucose] = useState('');

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
    setLogs([]); // Clear previous logs to prevent flicker between accounts
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
          notes: d.notes,
          bloodPressure: d.blood_pressure,
          glucose: d.glucose
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

  const fetchBabyInfo = async () => {
    if (!user?.currentWeek) return;
    setLoadingBaby(true);
    try {
      const res = await getBabyDevelopmentInfo(user.currentWeek, user.language);
      setBabyInfo(res);
    } catch (e) {
      console.error("Baby info error:", e);
    } finally {
      setLoadingBaby(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'baby' && !babyInfo) {
      fetchBabyInfo();
    }
  }, [activeTab, user.currentWeek]);

  const handleAddLog = async () => {
    if (!user.id) return;
    try {
      const newLogData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(weight) || null,
        mood,
        symptoms,
        notes,
        blood_pressure: bloodPressure || null,
        glucose: parseFloat(glucose) || null
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
          notes: data.notes,
          bloodPressure: data.blood_pressure,
          glucose: data.glucose
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
    setBloodPressure('');
    setGlucose('');
  };

  const deleteLog = async (id: string) => {
    const confirmed = window.confirm(language === 'bn' ? 'আপনি কি এই এন্ট্রিটি মুছতে চান?' : 'Are you sure you want to delete this log entry?');
    if (confirmed && user.id) {
      try {
        const { error } = await supabase
          .from('health_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

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

  const WeightChart: React.FC<{ logs: LogEntry[], language: Language }> = ({ logs, language }) => {
    const weightLogs = useMemo(() => 
      logs
        .filter(l => l.weight)
        .slice(0, 7)
        .reverse(), 
    [logs]);

    if (weightLogs.length < 2) return null;

    const weights = weightLogs.map(l => l.weight as number);
    const minWeight = Math.min(...weights) - 1;
    const maxWeight = Math.max(...weights) + 1;
    const range = maxWeight - minWeight;

    const width = 300;
    const height = 100;
    const padding = 20;

    const points = weightLogs.map((l, i) => {
      const x = (i / (weightLogs.length - 1)) * (width - padding * 2) + padding;
      const y = height - (((l.weight as number) - minWeight) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm space-y-4 animate-in fade-in duration-700">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-pink-500 rounded-full" />
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
              {language === 'bn' ? 'ওজন ট্র্যাকার' : 'Weight Trend'}
            </h3>
          </div>
          <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-full uppercase tracking-widest">Last {weightLogs.length} entries</span>
        </div>
        <div className="relative h-[120px] w-full flex items-center justify-center">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f8fafc" strokeWidth="1" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f8fafc" strokeWidth="1" />
            
            <polyline
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              filter="url(#shadow)"
            />
            
            {weightLogs.map((l, i) => {
              const x = (i / (weightLogs.length - 1)) * (width - padding * 2) + padding;
              const y = height - (((l.weight as number) - minWeight) / range) * (height - padding * 2) - padding;
              return (
                <g key={i} className="group">
                  <circle cx={x} cy={y} r="5" fill="white" stroke="#ec4899" strokeWidth="2" className="transition-all group-hover:r-7" />
                  <text x={x} y={y - 15} textAnchor="middle" className="text-[10px] font-black fill-pink-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {l.weight}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
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

      {/* Tab Switcher */}
      <div className="flex bg-gray-100 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
        >
          {language === 'bn' ? 'স্বাস্থ্য লগ' : 'Health Logs'}
        </button>
        <button 
          onClick={() => setActiveTab('baby')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'baby' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400'}`}
        >
          {language === 'bn' ? 'শিশুর বিকাশ' : 'Baby Development'}
        </button>
      </div>

      {activeTab === 'baby' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Week at a Glance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                {language === 'bn' ? 'আনুমানিক ওজন' : 'Est. Weight'}
              </p>
              <p className="text-xl font-bold text-gray-800">
                {user.currentWeek < 20 ? '~300g' : user.currentWeek < 30 ? '~1.3kg' : '~3.2kg'}
              </p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                {language === 'bn' ? 'আনুমানিক দৈর্ঘ্য' : 'Est. Length'}
              </p>
              <p className="text-xl font-bold text-gray-800">
                {user.currentWeek < 20 ? '~16cm' : user.currentWeek < 30 ? '~38cm' : '~50cm'}
              </p>
            </div>
          </div>

          {/* AI Baby Visualization Content */}
          <section className="bg-white rounded-[2rem] p-5 border border-pink-50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 text-pink-50/50">
              <Sparkles size={50} strokeWidth={1} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 shadow-inner">
                  <Baby size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                    {t.aiVisualization}
                  </h3>
                  <p className="text-sm font-bold text-gray-900">{t.week} {user.currentWeek}</p>
                </div>
              </div>
              
              {loadingBaby ? (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-50 rounded-full w-full animate-pulse" />
                  <div className="h-2 bg-gray-50 rounded-full w-4/5 animate-pulse" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 text-sm font-medium leading-relaxed">
                    {babyInfo || (user.language === 'bn' ? "আপনার শিশুর বিকাশের তথ্য লোড হচ্ছে..." : "Loading baby development info...")}
                  </p>
                  
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100/50">
                    <div className="flex items-center gap-2 text-xs font-black text-pink-500 uppercase tracking-widest mb-1.5">
                      <Sparkles size={12} />
                      {language === 'bn' ? 'এআই টিপস' : 'AI Tips'}
                    </div>
                    <p className="text-xs text-pink-700 font-semibold leading-relaxed">
                      {language === 'bn' 
                        ? 'আপনার শিশু এখন দ্রুত বাড়ছে! পর্যাপ্ত ক্যালসিয়াম এবং আয়রন সমৃদ্ধ খাবার নিশ্চিত করুন।' 
                        : 'Your baby is growing fast! Ensure you are getting enough calcium and iron-rich foods.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Visual Reference */}
          <div className="bg-indigo-600 rounded-[2rem] p-5 text-white relative overflow-hidden shadow-xl group">
            <div className="absolute right-0 bottom-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Baby size={80} />
            </div>
            <div className="relative z-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-80">
                {language === 'bn' ? 'আকারের তুলনা' : 'Size Comparison'}
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-inner">
                  <span className="text-2xl drop-shadow-lg">
                    {t.fruitReference[(user?.currentWeek || 1) - 1]?.split(' ')[0] || '👶'}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight">{t.fruitReference[(user?.currentWeek || 1) - 1] || 'Baby'}</p>
                  <p className="text-indigo-100 text-xs font-medium opacity-90 mt-0.5">
                    {language === 'bn' ? 'আপনার শিশু এখন এই আকারের!' : 'Your baby is about this size now!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What to expect */}
          <div className="bg-white p-5 rounded-[2rem] border border-pink-50 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
              {language === 'bn' ? 'এই সপ্তাহে যা আশা করবেন' : 'What to expect this week'}
            </h4>
            <div className="space-y-3">
              {[
                language === 'bn' ? 'শিশুর নড়াচড়া আরও স্পষ্ট হবে' : 'Baby\'s movements become more distinct',
                language === 'bn' ? 'ত্বকের পরিবর্তন দেখা দিতে পারে' : 'Skin changes might appear',
                language === 'bn' ? 'পিঠে ব্যথা বাড়তে পারে' : 'Backaches might increase'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* AI Insight Card */}
          {logs.length > 0 && (
            <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-6 opacity-20 group-hover:scale-110 transition-transform duration-700">
                <Sparkles size={60} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xs font-black mb-3 flex items-center gap-2 uppercase tracking-[0.2em] opacity-90">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Maa Care AI {language === 'bn' ? 'স্বাস্থ্য পরামর্শ' : 'Health Check'}
                </h3>
                {loadingInsight ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-white/20 rounded-full w-full" />
                    <div className="h-3 bg-white/20 rounded-full w-4/5" />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed font-bold tracking-tight">
                    {insight || (language === 'bn' ? "ব্যক্তিগত পরামর্শ পেতে আপনার স্বাস্থ্য লগ করতে থাকুন!" : "Keep logging your symptoms to get personalized advice!")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* History */}
          <div className="space-y-6">
            <WeightChart logs={logs} language={language || 'en'} />
            
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{t.history}</h3>
              <span className="text-xs font-bold text-gray-400">{logs.length} {language === 'bn' ? 'এন্ট্রি' : 'Entries'}</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading history...'}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <Clipboard size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.noHistory}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="bg-white p-6 rounded-[2rem] border border-pink-50 shadow-sm group hover:border-pink-200 hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          {moodIcons[log.mood]}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-800 text-sm tracking-tight">{log.date}</h4>
                          <span className="text-xs text-pink-500 uppercase font-black tracking-[0.15em]">{moodNames[log.mood]}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    {log.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {log.symptoms.map(s => (
                          <span key={s} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs rounded-full font-black uppercase tracking-wider border border-slate-100">{s}</span>
                        ))}
                      </div>
                    )}

                    {log.notes && (
                      <div className="relative mb-4">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-100 rounded-full" />
                        <p className="text-sm text-gray-600 pl-4 font-medium leading-relaxed italic">"{log.notes}"</p>
                      </div>
                    )}

                    <div className="flex gap-6 pt-4 border-t border-gray-50">
                      {log.weight && (
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{t.weight}</span>
                          <span className="text-sm font-bold text-gray-800">{log.weight} kg</span>
                        </div>
                      )}
                      {log.bloodPressure && (
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'bn' ? 'রক্তচাপ' : 'BP'}</span>
                          <span className="text-sm font-bold text-gray-800">{log.bloodPressure}</span>
                        </div>
                      )}
                      {log.glucose && (
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'bn' ? 'গ্লুকোজ' : 'Glucose'}</span>
                          <span className="text-sm font-bold text-gray-800">{log.glucose} mg/dL</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adding Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 pb-10 space-y-6 animate-in slide-in-from-bottom-10 duration-500 safe-area-bottom shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t.newEntry}</h2>
                <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mt-1">{new Date().toLocaleDateString()}</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-2xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[65vh] space-y-8 pr-2 -mr-2 custom-scrollbar">
              {/* Vital Signs Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-pink-500 rounded-full" />
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'bn' ? 'শারীরিক তথ্য' : 'Vital Signs'}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 focus-within:border-pink-200 transition-colors">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block">{t.weight} (kg)</label>
                    <input 
                      type="number" 
                      value={weight} 
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 65"
                      className="w-full bg-transparent text-lg font-bold text-gray-800 focus:outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 focus-within:border-pink-200 transition-colors">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block">{language === 'bn' ? 'রক্তচাপ' : 'BP'}</label>
                      <input 
                        type="text" 
                        value={bloodPressure} 
                        onChange={(e) => setBloodPressure(e.target.value)}
                        placeholder="120/80"
                        className="w-full bg-transparent text-lg font-bold text-gray-800 focus:outline-none"
                      />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 focus-within:border-pink-200 transition-colors">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block">{language === 'bn' ? 'গ্লুকোজ' : 'Glucose'}</label>
                      <input 
                        type="number" 
                        value={glucose} 
                        onChange={(e) => setGlucose(e.target.value)}
                        placeholder="95"
                        className="w-full bg-transparent text-lg font-bold text-gray-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mood Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-pink-500 rounded-full" />
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">{t.feeling}</h3>
                </div>
                <div className="flex justify-between bg-gray-50 p-3 rounded-[2rem] border border-gray-100">
                  {(Object.keys(moodIcons) as Array<keyof typeof moodIcons>).map((m) => (
                    <button 
                      key={m}
                      onClick={() => setMood(m)}
                      className={`p-4 rounded-2xl transition-all duration-300 ${mood === m ? 'bg-white shadow-lg scale-110 text-pink-500' : 'opacity-30 grayscale hover:opacity-60'}`}
                    >
                      {React.cloneElement(moodIcons[m] as React.ReactElement, { size: 28 })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-pink-500 rounded-full" />
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">{t.symptoms}</h3>
                </div>
                
                {allSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-pink-50/30 rounded-3xl border border-pink-100/50">
                    {allSuggestions.map(s => (
                      <button 
                        key={`suggest-${s}`}
                        onClick={() => toggleSymptom(s)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black transition-all border uppercase tracking-wider flex items-center gap-2 ${
                          symptoms.includes(s) ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-100' : 'bg-white text-pink-500 border-pink-100 hover:bg-pink-50'
                        }`}
                      >
                        {s} {symptoms.includes(s) ? <X size={12} /> : <Plus size={12} />}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {symptomList.map(s => (
                    <button 
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black transition-all border uppercase tracking-wider ${
                        symptoms.includes(s) ? 'bg-gray-800 text-white border-gray-800 shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-pink-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-pink-500 rounded-full" />
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">{t.notes}</h3>
                </div>
                <textarea 
                  placeholder={language === 'bn' ? 'আপনার অনুভূতি লিখুন...' : 'How are you really doing?'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] p-6 h-32 text-sm font-medium focus:ring-2 focus:ring-pink-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-5 bg-gray-50 text-gray-500 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleAddLog}
                className="flex-2 py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-pink-100 active:scale-95 transition-all"
              >
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTracker;

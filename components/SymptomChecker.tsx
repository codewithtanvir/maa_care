
import React, { useState } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Activity, ClipboardCheck, PhoneCall, Loader2 } from 'lucide-react';
import { checkSymptomsAI } from '../services/geminiService';
import { Language, LogEntry, View, UserProfile } from '../types';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onBack: () => void;
  onNavigate: (view: View) => void;
}

const SymptomChecker: React.FC<Props> = ({ user, onBack, onNavigate }) => {
  const language = user.language || 'en';
  const week = user.currentWeek || 1;
  const t = translations[language] || translations.en;
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ status: string; title: string; sections: { heading: string; body: string }[] } | null>(null);

  const symptomList = language === 'bn' 
    ? ['বমি বমি ভাব', 'মাথাব্যথা', 'পিঠে ব্যথা', 'ফোলাভাব', 'বুক জ্বালাপোড়া', 'ক্লান্তি', 'মাথা ঘোরা', 'পেটে ব্যথা', 'দৃষ্টি ঝাপসা']
    : ['Nausea', 'Headache', 'Back Pain', 'Swelling', 'Heartburn', 'Fatigue', 'Dizziness', 'Abdominal Pain', 'Blurred Vision'];

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !notes) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await checkSymptomsAI(user, selectedSymptoms, notes);
      
      // Improved parsing logic
      const lines = res.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let status = 'MONITOR';
      let title = language === 'bn' ? 'বিশ্লেষণ সম্পন্ন' : 'Analysis Complete';
      
      const firstLine = lines[0] || '';
      if (firstLine.includes('[') && firstLine.includes(']')) {
        const statusMatch = firstLine.match(/\[(.*?)\]/);
        if (statusMatch) {
          status = statusMatch[1].toUpperCase();
          title = firstLine.split(']')[1]?.replace('-', '').trim() || title;
        }
      }

      const sections: { heading: string; body: string }[] = [];
      let currentHeading = '';
      let currentBody = '';

      lines.forEach(line => {
        if (line.startsWith('###') || line.startsWith('**') && line.endsWith('**')) {
          if (currentHeading) sections.push({ heading: currentHeading, body: currentBody.trim() });
          currentHeading = line.replace(/[#*]/g, '').trim();
          currentBody = '';
        } else if (!line.includes('[STATUS]')) {
          currentBody += line + '\n';
        }
      });
      
      if (currentHeading) {
        sections.push({ heading: currentHeading, body: currentBody.trim() });
      } else if (lines.length > 1) {
        // Fallback if no headings found
        sections.push({ 
          heading: language === 'bn' ? 'বিস্তারিত বিশ্লেষণ' : 'Detailed Analysis', 
          body: lines.slice(1).join('\n') 
        });
      }

      setResult({ status, title, sections });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLog = async () => {
    if (!result || !user.id) return;
    setSaving(true);
    
    const newEntry = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      mood: 'nauseous',
      symptoms: selectedSymptoms,
      notes: `AI Assessment: ${result.status} - ${result.title}. ${notes}`
    };
    
    try {
      const { error } = await supabase
        .from('health_logs')
        .insert([newEntry]);
      
      if (error) throw error;
      
      alert(language === 'bn' ? 'লগ এ সংরক্ষিত হয়েছে!' : 'Saved to health log!');
      onNavigate(View.TRACKER);
    } catch (e) {
      console.error("Error saving symptom log:", e);
      alert(language === 'bn' ? 'সংরক্ষণ করতে সমস্যা হয়েছে।' : 'Failed to save log.');
    } finally {
      setSaving(false);
    }
  };

  const handleCallDoctor = () => {
    const phone = user.emergencyContactPhone || "999";
    window.location.href = `tel:${phone}`;
  };

  const getStatusColor = (status: string) => {
    if (status.includes('URGENT') || status.includes('জরুরি')) return 'from-red-500 to-rose-600';
    if (status.includes('MONITOR') || status.includes('নজর')) return 'from-amber-400 to-orange-500';
    return 'from-emerald-400 to-teal-500';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('URGENT') || status.includes('জরুরি')) return <AlertCircle size={28} className="animate-bounce" />;
    if (status.includes('MONITOR') || status.includes('নজর')) return <AlertTriangle size={28} className="animate-pulse" />;
    return <CheckCircle2 size={28} />;
  };

  return (
    <div className="p-6 space-y-8 pb-12 bg-white">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 hover:bg-pink-50 rounded-2xl transition-all text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{t.symptomChecker}</h1>
      </header>

      {!result && (
        <div className="bg-white p-6 rounded-[2rem] border border-pink-50 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-pink-500">
              <div className="p-2.5 bg-pink-50 rounded-2xl shadow-inner">
                <Activity size={18} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500">{language === 'bn' ? 'লক্ষণ নির্বাচন করুন' : 'Select Symptoms'}</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {symptomList.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black transition-all border uppercase tracking-wider ${
                    selectedSymptoms.includes(s) 
                      ? 'bg-pink-500 text-white border-pink-500 shadow-xl shadow-pink-100 scale-105' 
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-pink-200 hover:bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
              {language === 'bn' ? 'অতিরিক্ত তথ্য' : 'Additional Context'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'bn' ? 'বিস্তারিত লিখুন...' : 'Describe when it started...'}
              className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] p-5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-pink-400 focus:bg-white focus:outline-none min-h-[100px] transition-all placeholder:text-gray-300"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || (selectedSymptoms.length === 0 && !notes)}
            className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-pink-100 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            <span>{loading ? (language === 'bn' ? 'বিশ্লেষণ করা হচ্ছে...' : 'Analyzing...') : t.analyzeSymptoms}</span>
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-2xl">
            <div className={`p-5 text-white bg-gradient-to-br ${getStatusColor(result.status)} shadow-lg relative overflow-hidden`}>
              <div className="absolute -top-4 -right-4 p-6 opacity-20">
                {getStatusIcon(result.status)}
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-inner">
                  {getStatusIcon(result.status)}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-tight uppercase">
                    {result.status.includes('URGENT') ? t.urgent : result.status.includes('MONITOR') ? t.monitor : t.normal}
                  </h3>
                  <p className="text-white/90 text-xs font-black tracking-wide mt-0.5 uppercase opacity-80">{result.title}</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {result.sections.map((section, idx) => (
                <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <h4 className="text-xs font-black text-pink-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                    {section.heading}
                  </h4>
                  <div className="text-gray-700 leading-relaxed font-bold text-sm whitespace-pre-wrap pl-4 border-l-2 border-pink-50">
                    {section.body}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                  {language === 'bn' ? 'পরবর্তী পদক্ষেপ' : 'Next Steps'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleSaveToLog} 
                    disabled={saving}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 hover:border-pink-200 transition-all active:scale-95 group disabled:opacity-50"
                  >
                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />}
                    </div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                      {language === 'bn' ? 'লগ এ সেভ করুন' : 'Save to Log'}
                    </span>
                  </button>
                  <button onClick={handleCallDoctor} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 hover:border-blue-200 transition-all active:scale-95 group">
                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <PhoneCall size={18} />
                    </div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                      {language === 'bn' ? 'ডাক্তার কল করুন' : 'Call Doctor'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { setResult(null); setSelectedSymptoms([]); setNotes(''); }}
            className="w-full py-4 bg-white border border-gray-100 text-gray-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-sm hover:text-gray-600 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCw size={14} />
            {language === 'bn' ? 'আবার শুরু করুন' : 'Start Over'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;

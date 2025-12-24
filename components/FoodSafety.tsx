
import React, { useState } from 'react';
import { ArrowLeft, Search, CheckCircle2, XCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { getAIChatResponse } from '../services/geminiService';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';

interface Props {
  onBack: () => void;
  user: UserProfile;
}

const FoodSafety: React.FC<Props> = ({ onBack, user }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Localized concerns for Bangladesh
  const commonConcerns = language === 'bn' 
    ? ['ইলিশ মাছ', 'কাঁচা পেঁপে', 'আনারস', 'রঙ চা', 'ডালিম', 'মিষ্টি আলু']
    : ['Hilsa Fish', 'Raw Papaya', 'Pineapple', 'Black Tea', 'Pomegranate', 'Sweet Potato'];

  const checkFood = async (val?: string) => {
    const searchQuery = val || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const prompt = language === 'bn'
        ? `গর্ভবতী অবস্থায় "${searchQuery}" খাবারটি খাওয়া কি নিরাপদ? বাংলাদেশের প্রেক্ষাপটে এর অবস্থা (SAFE, AVOID, CAUTION) এবং ১-বাক্যে ব্যাখ্যা দিন। বিন্যাস: Status - Explanation। উত্তর বাংলায় দিন।`
        : `Tell me if "${searchQuery}" is generally safe to eat during pregnancy in a Bangladeshi context. Return status (SAFE, AVOID, CAUTION) and a 1-sentence explanation. Formatting: Status - Explanation.`;
      
      const res = await getAIChatResponse([], prompt, user);
      
      const parts = res.split(' - ');
      const statusText = parts[0]?.toUpperCase() || '';
      const status = statusText.includes('SAFE') || statusText.includes('নিরাপদ') ? 'SAFE' : 
                     statusText.includes('AVOID') || statusText.includes('বর্জনীয়') || statusText.includes('এড়িয়ে') ? 'AVOID' : 'CAUTION';
      
      setResult({ status, text: parts[1] || res });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 hover:bg-pink-50 rounded-2xl transition-all text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{language === 'bn' ? 'খাবার সতর্কতা' : 'Food Safety'}</h1>
      </header>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-[2rem] blur opacity-10 group-focus-within:opacity-20 transition duration-1000"></div>
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkFood()}
            placeholder={language === 'bn' ? 'খাবারের নাম লিখুন...' : t.sushiQuery}
            className="w-full bg-white border border-pink-100 rounded-[2rem] py-3.5 px-5 pr-16 shadow-sm focus:ring-2 focus:ring-pink-400 focus:outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
          />
          <button 
            onClick={() => checkFood()}
            disabled={loading}
            className="absolute right-2 top-2 p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-xl shadow-xl shadow-pink-100 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? <Sparkles size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
      </div>

      {result && (
        <div className={`p-5 rounded-[2rem] border-2 animate-in zoom-in duration-500 shadow-2xl ${
          result.status === 'SAFE' ? 'bg-green-50 border-green-100 text-green-900 shadow-green-100/20' :
          result.status === 'AVOID' ? 'bg-red-50 border-red-100 text-red-900 shadow-red-100/20' :
          'bg-amber-50 border-amber-100 text-amber-900 shadow-amber-100/20'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${
              result.status === 'SAFE' ? 'bg-green-500 text-white' :
              result.status === 'AVOID' ? 'bg-red-500 text-white' :
              'bg-amber-500 text-white'
            }`}>
              {result.status === 'SAFE' && <CheckCircle2 size={18} />}
              {result.status === 'AVOID' && <XCircle size={18} />}
              {result.status === 'CAUTION' && <AlertTriangle size={18} />}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t[result.status.toLowerCase() as keyof typeof t] || result.status}</h3>
              <p className="text-xs font-black uppercase tracking-widest opacity-60">{language === 'bn' ? 'এআই বিশ্লেষণ' : 'AI Analysis'}</p>
            </div>
          </div>
          <p className="leading-relaxed font-bold text-sm tracking-tight">{result.text}</p>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1 h-3 bg-pink-500 rounded-full" />
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{t.commonConcerns}</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {commonConcerns.map(f => (
            <button 
              key={f}
              onClick={() => { setQuery(f); checkFood(f); }}
              className="p-4 bg-white border border-pink-50 rounded-[1.5rem] text-xs font-black text-gray-700 hover:border-pink-200 hover:shadow-md transition-all text-left shadow-sm active:scale-95 group"
            >
              <div className="flex justify-between items-center">
                <span>{f}</span>
                <Sparkles size={12} className="text-pink-200 group-hover:text-pink-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 mt-8">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 font-bold italic leading-relaxed uppercase tracking-tight">
            {language === 'bn' 
              ? "সতর্কতা: এটি সাধারণ তথ্যের জন্য। গর্ভাবস্থায় যেকোনো খাবার বা ওষুধ খাওয়ার আগে আপনার ডাক্তারের পরামর্শ নিন।" 
              : "Disclaimer: This is for general information only. Always consult your doctor before changing your pregnancy diet."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FoodSafety;


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
    <div className="p-6 space-y-6 pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-all">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{language === 'bn' ? 'খাবার সতর্কতা' : 'Food Safety'}</h1>
      </header>

      <div className="relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkFood()}
          placeholder={language === 'bn' ? 'খাবারের নাম লিখুন...' : t.sushiQuery}
          className="w-full bg-white border border-pink-100 rounded-2xl py-5 px-6 pr-16 shadow-sm focus:ring-2 focus:ring-pink-400 focus:outline-none transition-all font-medium text-gray-700"
        />
        <button 
          onClick={() => checkFood()}
          disabled={loading}
          className="absolute right-3 top-2.5 p-3 bg-pink-500 text-white rounded-xl shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? <Sparkles size={20} className="animate-spin" /> : <Search size={20} />}
        </button>
      </div>

      {result && (
        <div className={`p-6 rounded-3xl border animate-in zoom-in duration-300 ${
          result.status === 'SAFE' ? 'bg-green-50 border-green-100 text-green-900 shadow-green-100/50 shadow-lg' :
          result.status === 'AVOID' ? 'bg-red-50 border-red-100 text-red-900 shadow-red-100/50 shadow-lg' :
          'bg-amber-50 border-amber-100 text-amber-900 shadow-amber-100/50 shadow-lg'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {result.status === 'SAFE' && <CheckCircle2 className="text-green-500" />}
            {result.status === 'AVOID' && <XCircle className="text-red-500" />}
            {result.status === 'CAUTION' && <AlertTriangle className="text-amber-500" />}
            <h3 className="text-xl font-bold">{t[result.status.toLowerCase() as keyof typeof t] || result.status}</h3>
          </div>
          <p className="leading-relaxed font-semibold text-sm">{result.text}</p>
        </div>
      )}

      <div className="space-y-4 pt-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{t.commonConcerns}</h4>
        <div className="grid grid-cols-2 gap-3">
          {commonConcerns.map(f => (
            <button 
              key={f}
              onClick={() => { setQuery(f); checkFood(f); }}
              className="p-4 bg-white border border-pink-50 rounded-2xl text-sm font-bold text-gray-700 hover:border-pink-200 transition-all text-left shadow-sm active:scale-95"
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-pink-50 shadow-sm mt-8">
        <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed">
          {language === 'bn' 
            ? "সতর্কতা: এটি সাধারণ তথ্যের জন্য। গর্ভাবস্থায় যেকোনো খাবার বা ওষুধ খাওয়ার আগে আপনার ডাক্তারের পরামর্শ নিন।" 
            : "Disclaimer: This is for general information only. Always consult your doctor before changing your pregnancy diet."}
        </p>
      </div>
    </div>
  );
};

export default FoodSafety;

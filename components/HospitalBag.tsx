
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Circle, Briefcase, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface BagItem {
  id: number;
  text: string;
  checked: boolean;
  category: string;
}

interface Props {
  onBack: () => void;
  user: UserProfile;
}

const HospitalBag: React.FC<Props> = ({ onBack, user }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;
  const [items, setItems] = useState<BagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBag();
  }, [user.id]);

  const fetchBag = async () => {
    if (!user.id) return;
    setIsLoading(true);
    setItems([]); // Clear previous items to prevent flicker between accounts
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hospital_bag')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data?.hospital_bag && (data.hospital_bag as BagItem[]).length > 0) {
        setItems(data.hospital_bag as BagItem[]);
      } else {
        // Default items
        const defaultItems = language === 'bn' ? [
          { id: 1, text: "জন্ম পরিকল্পনা ও আইডি", checked: false, category: t.mama },
          { id: 2, text: "আরামদায়ক নাইটি", checked: false, category: t.mama },
          { id: 3, text: "নার্সিং ব্রা ও প্যাড", checked: false, category: t.mama },
          { id: 4, text: "প্রসাধন সামগ্রী (লিপ বাম!)", checked: false, category: t.mama },
          { id: 5, text: "শিশুর পোশাক (২-৩টি)", checked: false, category: t.baby },
          { id: 6, text: "শিশুকে মোড়ানোর কম্বল (Swaddle)", checked: false, category: t.baby },
          { id: 7, text: "গাড়ির সিট (আগেই ইনস্টল করা)", checked: false, category: t.essential },
          { id: 8, text: "অতিরিক্ত লম্বা ফোন চার্জার", checked: false, category: t.partner },
        ] : [
          { id: 1, text: "Birth plan & ID", checked: false, category: t.mama },
          { id: 2, text: "Comfortable nightgown", checked: false, category: t.mama },
          { id: 3, text: "Nursing bras & pads", checked: false, category: t.mama },
          { id: 4, text: "Tolietries (Lip balm!)", checked: false, category: t.mama },
          { id: 5, text: "Baby outfits (2-3 sizes)", checked: false, category: t.baby },
          { id: 6, text: "Swaddle blankets", checked: false, category: t.baby },
          { id: 7, text: "Car seat (already installed)", checked: false, category: t.essential },
          { id: 8, text: "Extra-long phone charger", checked: false, category: t.partner },
        ];
        setItems(defaultItems);
      }
    } catch (e) {
      console.error("Error fetching hospital bag:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle = async (id: number) => {
    const updatedItems = items.map((i: BagItem) => i.id === id ? { ...i, checked: !i.checked } : i);
    setItems(updatedItems);
    
    try {
      await supabase
        .from('profiles')
        .update({ hospital_bag: updatedItems })
        .eq('id', user.id);
    } catch (e) {
      console.error("Error updating hospital bag:", e);
    }
  };

  const completed = items.filter((i: BagItem) => i.checked).length;

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t.loading}...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 hover:bg-indigo-50 rounded-2xl transition-all text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">{t.hospitalBag}</h1>
      </header>

      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
        <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Briefcase size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">{language === 'bn' ? 'প্রস্তুতি' : 'Preparation'}</p>
              <h2 className="text-4xl font-black tracking-tight">{Math.round((completed / items.length) * 100)}%</h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest opacity-80">{completed} / {items.length}</p>
              <p className="text-xs font-bold opacity-60">{t.packed}</p>
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              style={{ width: `${(completed / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pb-24">
        {items.map((item: any) => (
          <button 
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all duration-300 border text-left group ${
              item.checked 
                ? 'bg-gray-50/50 border-gray-100 opacity-60' 
                : 'bg-white border-indigo-50 shadow-sm hover:border-indigo-200 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                item.checked ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-300 group-hover:text-indigo-500'
              }`}>
                {item.checked ? <CheckCircle size={24} /> : <Circle size={24} />}
              </div>
              <div>
                <p className={`font-black text-base tracking-tight transition-all ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.text}</p>
                <span className={`text-xs uppercase tracking-[0.15em] font-black ${item.checked ? 'text-gray-300' : 'text-indigo-500'}`}>{item.category}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HospitalBag;

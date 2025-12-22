
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Circle, Briefcase, Loader2 } from 'lucide-react';
import { Language, UserProfile } from '../types';
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
    <div className="p-6 space-y-6 pb-12">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-all">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{t.hospitalBag}</h1>
      </header>

      <div className="bg-gradient-to-br from-indigo-500 to-blue-400 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <Briefcase size={32} />
          <span className="text-3xl font-bold">{Math.round((completed / items.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${(completed / items.length) * 100}%` }}
          />
        </div>
        <p className="mt-4 text-xs opacity-90 font-bold uppercase tracking-widest">{completed} of {items.length} {t.packed}</p>
      </div>

      <div className="space-y-3 pb-24">
        {items.map((item: any) => (
          <button 
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border text-left ${
              item.checked ? 'bg-white/40 border-gray-100 opacity-60' : 'bg-white border-pink-50 shadow-sm hover:border-pink-200'
            }`}
          >
            <div className="flex items-center gap-4">
              {item.checked ? <CheckCircle className="text-green-500 flex-shrink-0" /> : <Circle className="text-gray-200 flex-shrink-0" />}
              <div>
                <p className={`font-bold text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.text}</p>
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{item.category}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HospitalBag;


import React from 'react';
import { UserProfile, Language } from '../types';
import { ArrowLeft, Apple, Droplets, Moon, Heart, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const NutritionGuide: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;
  const week = user.currentWeek || 1;

  const getTrimester = () => {
    if (week <= 12) return 1;
    if (week <= 26) return 2;
    return 3;
  };

  const trimester = getTrimester();

  const nutritionTips = language === 'bn' ? [
    { title: 'প্রোটিন', desc: 'মাছ, মাংস, ডিম, ডাল এবং বাদাম খান। এটি শিশুর অঙ্গ গঠনে সাহায্য করে।', icon: Heart, color: 'text-red-500' },
    { title: 'ক্যালসিয়াম', desc: 'দুধ, দই, পনির এবং ছোট মাছ খান। এটি শিশুর হাড় ও দাঁত মজবুত করে।', icon: CheckCircle2, color: 'text-blue-500' },
    { title: 'আয়রন ও ফলিক অ্যাসিড', desc: 'সবুজ শাকসবজি (যেমন পালং শাক), কলিজা এবং ডাল খান। এটি রক্তস্বল্পতা রোধ করে।', icon: Apple, color: 'text-green-500' },
    { title: 'হাইড্রেটেড থাকুন', desc: 'প্রতিদিন অন্তত ৮-১০ গ্লাস পানি পান করুন। ডাবের পানিও খুব উপকারী।', icon: Droplets, color: 'text-cyan-500' },
  ] : [
    { title: 'Protein', desc: 'Eat fish, meat, eggs, lentils, and nuts. Essential for baby\'s organ development.', icon: Heart, color: 'text-red-500' },
    { title: 'Calcium', desc: 'Include milk, yogurt, cheese, and small fish. Helps build baby\'s bones and teeth.', icon: CheckCircle2, color: 'text-blue-500' },
    { title: 'Iron & Folic Acid', desc: 'Eat leafy greens (spinach), liver, and lentils to prevent anemia.', icon: Apple, color: 'text-green-500' },
    { title: 'Stay Hydrated', desc: 'Drink 8-10 glasses of water daily. Coconut water is also great.', icon: Droplets, color: 'text-cyan-500' },
  ];

  const careTips = language === 'bn' ? [
    { title: 'পর্যাপ্ত বিশ্রাম', desc: 'রাতে অন্তত ৮ ঘণ্টা ঘুমান এবং দিনে ১-২ ঘণ্টা বিশ্রাম নিন।', icon: Moon },
    { title: 'হালকা ব্যায়াম', desc: 'প্রতিদিন ১৫-২০ মিনিট হাঁটাহাঁটি করুন। এটি শরীর সচল রাখে।', icon: Info },
    { title: 'মানসিক প্রশান্তি', desc: 'পছন্দের বই পড়ুন বা গান শুনুন। দুশ্চিন্তা মুক্ত থাকার চেষ্টা করুন।', icon: Heart },
  ] : [
    { title: 'Adequate Rest', desc: 'Sleep at least 8 hours at night and take 1-2 hours of rest during the day.', icon: Moon },
    { title: 'Light Exercise', desc: 'Walk for 15-20 minutes daily to stay active and improve circulation.', icon: Info },
    { title: 'Mental Well-being', desc: 'Read books or listen to music. Try to stay stress-free.', icon: Heart },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t.nutrition}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Trimester Info */}
        <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Info className="w-5 h-5 text-pink-600" />
            </div>
            <h2 className="font-bold text-pink-800">
              {trimester === 1 ? t.trimester1 : trimester === 2 ? t.trimester2 : t.trimester3}
            </h2>
          </div>
          <p className="text-sm text-pink-700">
            {language === 'bn' 
              ? `আপনি এখন গর্ভাবস্থার ${trimester}ম ট্রাইমেস্টারে আছেন। এই সময়ে আপনার এবং শিশুর জন্য বিশেষ পুষ্টি প্রয়োজন।`
              : `You are in your ${trimester}${trimester === 1 ? 'st' : trimester === 2 ? 'nd' : 'rd'} trimester. Special nutrition is vital for you and your baby now.`}
          </p>
        </div>

        {/* Nutrition Section */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Apple className="w-5 h-5 text-green-600" />
            {t.nutritionGuide}
          </h3>
          <div className="grid gap-4">
            {nutritionTips.map((tip, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className={`p-3 bg-gray-50 rounded-xl ${tip.color}`}>
                  <tip.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{tip.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Care Tips Section */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            {t.careTips}
          </h3>
          <div className="grid gap-4">
            {careTips.map((tip, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="p-3 bg-gray-50 rounded-xl text-gray-600">
                  <tip.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{tip.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Warning Section */}
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-amber-800">
              {language === 'bn' ? 'সতর্কতা' : 'Important Note'}
            </h2>
          </div>
          <p className="text-xs text-amber-700">
            {language === 'bn'
              ? 'যেকোনো নতুন খাবার বা ব্যায়াম শুরু করার আগে আপনার ডাক্তারের সাথে পরামর্শ করুন। এই তথ্যগুলো সাধারণ নির্দেশিকা মাত্র।'
              : 'Always consult your doctor before starting any new diet or exercise routine. These are general guidelines only.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NutritionGuide;

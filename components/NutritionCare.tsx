import React, { useState, useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { 
  ArrowLeft, Apple, Droplets, Moon, Heart, Info, CheckCircle2, AlertTriangle,
  Sparkles, Loader2, Send, ChefHat, Utensils, Leaf, Coffee, Fish, Egg, Milk,
  Cookie, RefreshCw, MessageCircle, X, ThumbsUp, ThumbsDown, Clock, Flame,
  Target, Zap, Brain, Salad, Soup, UtensilsCrossed, Search, XCircle, ShieldCheck
} from 'lucide-react';
import { translations } from '../translations';
import { generateAIResponse, isAIServiceAvailable } from '../services/aiService';
import { getAIChatResponse } from '../services/geminiService';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

interface MealPlan {
  breakfast: string;
  midMorningSnack: string;
  lunch: string;
  afternoonSnack: string;
  dinner: string;
  eveningSnack: string;
  tips: string[];
}

interface NutritionQuestion {
  question: string;
  answer: string;
  isLoading: boolean;
}

interface FoodCheckResult {
  status: 'SAFE' | 'AVOID' | 'CAUTION';
  text: string;
}

const NutritionCare: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;
  const week = user.currentWeek || 1;

  // Tab can be: tips, mealplan, foodcheck, ask
  const [activeTab, setActiveTab] = useState<'tips' | 'mealplan' | 'foodcheck' | 'ask'>('tips');
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoadingMealPlan, setIsLoadingMealPlan] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<NutritionQuestion[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [quickTip, setQuickTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Food Safety State
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResult, setFoodResult] = useState<FoodCheckResult | null>(null);
  const [isCheckingFood, setIsCheckingFood] = useState(false);

  const getTrimester = () => {
    if (week <= 12) return 1;
    if (week <= 26) return 2;
    return 3;
  };

  const trimester = getTrimester();

  // Check AI availability on mount
  useEffect(() => {
    const available = isAIServiceAvailable();
    setAiAvailable(available);
    console.log('[NutritionCare] AI Service Available:', available);
  }, []);

  // Common food concerns for Bangladesh
  const commonFoodConcerns = language === 'bn' 
    ? ['ইলিশ মাছ', 'কাঁচা পেঁপে', 'আনারস', 'রঙ চা', 'ডালিম', 'মিষ্টি আলু']
    : ['Hilsa Fish', 'Raw Papaya', 'Pineapple', 'Black Tea', 'Pomegranate', 'Sweet Potato'];

  // Check food safety
  const checkFood = async (val?: string) => {
    const searchQuery = val || foodQuery;
    if (!searchQuery.trim()) return;
    setIsCheckingFood(true);
    setFoodResult(null);
    try {
      const prompt = language === 'bn'
        ? `গর্ভবতী অবস্থায় "${searchQuery}" খাবারটি খাওয়া কি নিরাপদ? বাংলাদেশের প্রেক্ষাপটে এর অবস্থা (SAFE, AVOID, CAUTION) এবং ১-বাক্যে ব্যাখ্যা দিন। বিন্যাস: Status - Explanation। উত্তর বাংলায় দিন।`
        : `Tell me if "${searchQuery}" is generally safe to eat during pregnancy in a Bangladeshi context. Return status (SAFE, AVOID, CAUTION) and a 1-sentence explanation. Formatting: Status - Explanation.`;
      
      const res = await getAIChatResponse([], prompt, user);
      
      const parts = res.split(' - ');
      const statusText = parts[0]?.toUpperCase() || '';
      const status = statusText.includes('SAFE') || statusText.includes('নিরাপদ') ? 'SAFE' : 
                     statusText.includes('AVOID') || statusText.includes('বর্জনীয়') || statusText.includes('এড়িয়ে') ? 'AVOID' : 'CAUTION';
      
      setFoodResult({ status: status as FoodCheckResult['status'], text: parts[1] || res });
    } catch (e) {
      console.error(e);
      setFoodResult({ 
        status: 'CAUTION', 
        text: language === 'bn' ? 'তথ্য পেতে সমস্যা হয়েছে। ডাক্তারের সাথে পরামর্শ করুন।' : 'Could not get information. Please consult your doctor.' 
      });
    } finally {
      setIsCheckingFood(false);
    }
  };

  // Generate personalized AI meal plan
  const generateMealPlan = async () => {
    if (!isAIServiceAvailable()) {
      setAiAvailable(false);
      setError(language === 'bn' ? 'AI সেবা বর্তমানে উপলব্ধ নেই' : 'AI service is not available');
      setIsLoadingMealPlan(false);
      return;
    }
    
    setError(null);
    setIsLoadingMealPlan(true);
    try {
      const systemInstruction = language === 'bn'
        ? `আপনি একজন বিশেষজ্ঞ বাংলাদেশী মাতৃত্বকালীন পুষ্টিবিদ। গর্ভবতী মায়ের জন্য সুষম খাদ্য তালিকা তৈরি করুন। বাংলাদেশী খাবার যেমন ভাত, মাছ, ডাল, শাকসবজি, ডাবের পানি ব্যবহার করুন।`
        : `You are an expert Bangladeshi maternity nutritionist. Create a balanced meal plan for pregnant mothers using local Bangladeshi foods.`;

      const response = await generateAIResponse({
        messages: [{
          role: 'user',
          content: language === 'bn'
            ? `গর্ভাবস্থার ${week} সপ্তাহে একজন মায়ের জন্য একদিনের পুষ্টিকর খাদ্য তালিকা তৈরি করুন। মায়ের বয়স ${user.age || 25}, ওজন ${user.weight || 55} কেজি।

JSON ফরম্যাটে উত্তর দিন:
{
  "breakfast": "সকালের নাস্তা",
  "midMorningSnack": "সকাল ১১টার হালকা খাবার", 
  "lunch": "দুপুরের খাবার",
  "afternoonSnack": "বিকেলের নাস্তা",
  "dinner": "রাতের খাবার",
  "eveningSnack": "ঘুমানোর আগে হালকা খাবার",
  "tips": ["টিপস ১", "টিপস ২", "টিপস ৩"]
}`
            : `Create a nutritious one-day meal plan for a mother in week ${week} of pregnancy. Age: ${user.age || 25}, weight: ${user.weight || 55}kg.

Respond in JSON format:
{
  "breakfast": "breakfast details",
  "midMorningSnack": "mid-morning snack",
  "lunch": "lunch details",
  "afternoonSnack": "afternoon snack",
  "dinner": "dinner details",
  "eveningSnack": "light evening snack",
  "tips": ["tip 1", "tip 2", "tip 3"]
}`
        }],
        systemInstruction,
        temperature: 0.7,
        maxTokens: 1024
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setMealPlan(parsed);
        setError(null);
      } else {
        setMealPlan(getDefaultMealPlan());
      }
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      setError(language === 'bn' ? 'খাদ্য তালিকা তৈরিতে সমস্যা হয়েছে।' : 'Failed to generate meal plan.');
    } finally {
      setIsLoadingMealPlan(false);
    }
  };

  // Ask nutrition question
  const askQuestion = async () => {
    if (!question.trim()) return;
    
    if (!isAIServiceAvailable()) {
      setAiAvailable(false);
      setChatHistory(prev => [...prev, {
        question: question.trim(),
        answer: language === 'bn' ? 'দুঃখিত, AI সেবা বর্তমানে উপলব্ধ নেই।' : 'Sorry, AI service is currently unavailable.',
        isLoading: false
      }]);
      setQuestion('');
      return;
    }

    const newQuestion: NutritionQuestion = {
      question: question.trim(),
      answer: '',
      isLoading: true
    };

    setChatHistory(prev => [...prev, newQuestion]);
    setQuestion('');
    setIsAsking(true);

    try {
      const systemInstruction = language === 'bn'
        ? `আপনি 'Maa Care AI', একজন বিশেষজ্ঞ মাতৃত্বকালীন পুষ্টি পরামর্শদাতা। বাংলাদেশী প্রেক্ষাপট এবং স্থানীয় খাবার বিবেচনায় রাখুন। সংক্ষিপ্ত কিন্তু সহায়ক উত্তর দিন।`
        : `You are 'Maa Care AI', an expert maternity nutrition counselor. Consider Bangladeshi context and local foods. Give concise but helpful answers.`;

      const response = await generateAIResponse({
        messages: [{
          role: 'user',
          content: `Pregnancy Week: ${week}. Question: ${newQuestion.question}. Language: ${language === 'bn' ? 'Bengali' : 'English'}.`
        }],
        systemInstruction,
        temperature: 0.7,
        maxTokens: 512
      });

      setChatHistory(prev => prev.map((q, i) => 
        i === prev.length - 1 ? { ...q, answer: response.content, isLoading: false } : q
      ));
    } catch (error) {
      console.error('Error asking question:', error);
      setChatHistory(prev => prev.map((q, i) => 
        i === prev.length - 1 ? { 
          ...q, 
          answer: language === 'bn' ? 'দুঃখিত, উত্তর দিতে সমস্যা হয়েছে।' : 'Sorry, there was an error.',
          isLoading: false 
        } : q
      ));
    } finally {
      setIsAsking(false);
    }
  };

  // Get AI quick tip
  const getQuickTip = async () => {
    if (!isAIServiceAvailable()) {
      setAiAvailable(false);
      const fallbackTips = language === 'bn' 
        ? [
            'প্রতিদিন অন্তত ৮ গ্লাস পানি পান করুন এবং ডাবের পানি খান।',
            'সবুজ শাকসবজি খান, বিশেষ করে পালং শাক যা আয়রন সমৃদ্ধ।',
            'প্রোটিনের জন্য মাছ, ডিম এবং ডাল নিয়মিত খান।',
            'দুধ ও দুগ্ধজাত খাবার ক্যালসিয়ামের জন্য অপরিহার্য।'
          ]
        : [
            'Drink at least 8 glasses of water daily and include coconut water.',
            'Eat green leafy vegetables, especially spinach which is rich in iron.',
            'Include fish, eggs, and lentils regularly for protein.',
            'Milk and dairy products are essential for calcium.'
          ];
      setQuickTip(fallbackTips[Math.floor(Math.random() * fallbackTips.length)]);
      return;
    }
    
    setIsLoadingTip(true);
    try {
      const response = await generateAIResponse({
        messages: [{
          role: 'user',
          content: language === 'bn'
            ? `গর্ভাবস্থার ${week} সপ্তাহে একটি গুরুত্বপূর্ণ পুষ্টি টিপস দিন। বাংলাদেশী খাবার এবং সংস্কৃতি বিবেচনায় রাখুন। ২ বাক্যে উত্তর দিন।`
            : `Give one important nutrition tip for week ${week} of pregnancy. Consider Bangladeshi food and culture. Answer in 2 sentences.`
        }],
        temperature: 0.8,
        maxTokens: 150
      });
      setQuickTip(response.content);
    } catch (error: any) {
      console.error('Error getting quick tip:', error);
      setQuickTip(language === 'bn' 
        ? 'প্রতিদিন তাজা ফলমূল এবং সবজি খান। পর্যাপ্ত পানি পান করুন।'
        : 'Eat fresh fruits and vegetables daily. Stay well hydrated.');
    } finally {
      setIsLoadingTip(false);
    }
  };

  // Default meal plan
  const getDefaultMealPlan = (): MealPlan => ({
    breakfast: language === 'bn' 
      ? '২টি রুটি + ১টি ডিম ভাজি + ১ গ্লাস দুধ + কলা' 
      : '2 rotis + 1 boiled/fried egg + 1 glass milk + banana',
    midMorningSnack: language === 'bn' 
      ? 'মৌসুমি ফল (আম, পেয়ারা, আপেল) + কয়েকটি বাদাম' 
      : 'Seasonal fruits + a handful of nuts',
    lunch: language === 'bn' 
      ? '১.৫ কাপ ভাত + মাছের ঝোল + শাক ভাজি + ডাল + সালাদ' 
      : '1.5 cups rice + fish curry + sautéed greens + dal + salad',
    afternoonSnack: language === 'bn' 
      ? 'দই/লাচ্ছি + বিস্কুট বা মুড়ি' 
      : 'Yogurt/lassi + biscuits or puffed rice',
    dinner: language === 'bn' 
      ? '২টি রুটি + মুরগি/মাছ + সবজি + ডাল' 
      : '2 rotis + chicken/fish + vegetables + dal',
    eveningSnack: language === 'bn' 
      ? '১ গ্লাস দুধ বা হরলিক্স' 
      : '1 glass milk or Horlicks',
    tips: language === 'bn' 
      ? ['প্রতিদিন ৮-১০ গ্লাস পানি পান করুন', 'খাবারে লেবু যোগ করুন আয়রন শোষণের জন্য', 'ছোট ছোট বারে খাবার খান']
      : ['Drink 8-10 glasses of water daily', 'Add lemon to meals for iron absorption', 'Eat smaller meals more frequently']
  });

  const nutritionTips = language === 'bn' ? [
    { title: 'প্রোটিন', desc: 'মাছ, মাংস, ডিম, ডাল এবং বাদাম খান। এটি শিশুর অঙ্গ গঠনে সাহায্য করে।', icon: Fish, color: 'from-red-500 to-rose-600', bg: 'bg-red-50' },
    { title: 'ক্যালসিয়াম', desc: 'দুধ, দই, পনির এবং ছোট মাছ খান। এটি শিশুর হাড় ও দাঁত মজবুত করে।', icon: Milk, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50' },
    { title: 'আয়রন ও ফলিক অ্যাসিড', desc: 'সবুজ শাকসবজি, কলিজা এবং ডাল খান। এটি রক্তস্বল্পতা রোধ করে।', icon: Leaf, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
    { title: 'হাইড্রেটেড থাকুন', desc: 'প্রতিদিন অন্তত ৮-১০ গ্লাস পানি পান করুন। ডাবের পানিও খুব উপকারী।', icon: Droplets, color: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50' },
  ] : [
    { title: 'Protein', desc: 'Eat fish, meat, eggs, lentils, and nuts. Essential for baby\'s organ development.', icon: Fish, color: 'from-red-500 to-rose-600', bg: 'bg-red-50' },
    { title: 'Calcium', desc: 'Include milk, yogurt, cheese, and small fish. Helps build baby\'s bones and teeth.', icon: Milk, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50' },
    { title: 'Iron & Folic Acid', desc: 'Eat leafy greens, liver, and lentils to prevent anemia.', icon: Leaf, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
    { title: 'Stay Hydrated', desc: 'Drink 8-10 glasses of water daily. Coconut water is also great.', icon: Droplets, color: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50' },
  ];

  const careTips = language === 'bn' ? [
    { title: 'পর্যাপ্ত বিশ্রাম', desc: 'রাতে অন্তত ৮ ঘণ্টা ঘুমান এবং দিনে ১-২ ঘণ্টা বিশ্রাম নিন।', icon: Moon, color: 'from-indigo-500 to-violet-600' },
    { title: 'হালকা ব্যায়াম', desc: 'প্রতিদিন ১৫-২০ মিনিট হাঁটাহাঁটি করুন। এটি শরীর সচল রাখে।', icon: Zap, color: 'from-amber-500 to-orange-600' },
    { title: 'মানসিক প্রশান্তি', desc: 'পছন্দের বই পড়ুন বা গান শুনুন। দুশ্চিন্তা মুক্ত থাকার চেষ্টা করুন।', icon: Brain, color: 'from-pink-500 to-rose-600' },
  ] : [
    { title: 'Adequate Rest', desc: 'Sleep at least 8 hours at night and take 1-2 hours of rest during the day.', icon: Moon, color: 'from-indigo-500 to-violet-600' },
    { title: 'Light Exercise', desc: 'Walk for 15-20 minutes daily to stay active and improve circulation.', icon: Zap, color: 'from-amber-500 to-orange-600' },
    { title: 'Mental Well-being', desc: 'Read books or listen to music. Try to stay stress-free.', icon: Brain, color: 'from-pink-500 to-rose-600' },
  ];

  const quickQuestions = language === 'bn' 
    ? ['কাঁচা পেঁপে কি নিরাপদ?', 'কফি পান করতে পারি?', 'মধু খেতে পারব?', 'সামুদ্রিক মাছ?']
    : ['Is raw papaya safe?', 'Can I have coffee?', 'Is honey safe?', 'Seafood ok?'];

  const mealIcons = {
    breakfast: Egg,
    midMorningSnack: Apple,
    lunch: Soup,
    afternoonSnack: Cookie,
    dinner: UtensilsCrossed,
    eveningSnack: Milk
  };

  const mealLabels = language === 'bn' ? {
    breakfast: 'সকালের নাস্তা',
    midMorningSnack: 'মধ্য-সকাল',
    lunch: 'দুপুরের খাবার',
    afternoonSnack: 'বিকেলের নাস্তা',
    dinner: 'রাতের খাবার',
    eveningSnack: 'রাতে ঘুমানোর আগে'
  } : {
    breakfast: 'Breakfast',
    midMorningSnack: 'Mid-Morning',
    lunch: 'Lunch',
    afternoonSnack: 'Afternoon Snack',
    dinner: 'Dinner',
    eveningSnack: 'Before Bed'
  };

  const mealTimes = {
    breakfast: '7:00 - 8:00',
    midMorningSnack: '10:30',
    lunch: '1:00 - 2:00',
    afternoonSnack: '4:30',
    dinner: '7:30 - 8:30',
    eveningSnack: '9:30'
  };

  const tabs = [
    { id: 'tips', label: language === 'bn' ? 'টিপস' : 'Tips', icon: Apple },
    { id: 'mealplan', label: language === 'bn' ? 'খাদ্য' : 'Meal', icon: ChefHat },
    { id: 'foodcheck', label: language === 'bn' ? 'নিরাপদ?' : 'Safe?', icon: ShieldCheck },
    { id: 'ask', label: language === 'bn' ? 'AI' : 'Ask AI', icon: MessageCircle },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full blur-3xl opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-800 tracking-tight">
              {language === 'bn' ? 'পুষ্টি ও যত্ন' : 'Nutrition & Care'}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {language === 'bn' ? `${trimester}ম ট্রাইমেস্টার • সপ্তাহ ${week}` : `Trimester ${trimester} • Week ${week}`}
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
            <Sparkles size={18} className="text-white" />
          </div>
        </div>

        {/* Tab Navigation - 4 Tabs */}
        <div className="px-4 pb-3 flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 space-y-5">
        
        {/* ==================== TIPS TAB ==================== */}
        {activeTab === 'tips' && (
          <>
            {/* AI Quick Tip Card */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-5 text-white shadow-xl shadow-green-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">{language === 'bn' ? 'AI পুষ্টি টিপস' : 'AI Nutrition Tip'}</h3>
                    <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-full">AI</span>
                  </div>
                  {isLoadingTip ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm opacity-80">{language === 'bn' ? 'টিপস লোড হচ্ছে...' : 'Loading tip...'}</span>
                    </div>
                  ) : quickTip ? (
                    <p className="text-sm leading-relaxed opacity-90">{quickTip}</p>
                  ) : (
                    <p className="text-sm opacity-80">
                      {language === 'bn' 
                        ? 'আপনার জন্য ব্যক্তিগতকৃত পুষ্টি পরামর্শ পেতে নিচের বাটনে ক্লিক করুন।'
                        : 'Click below to get personalized nutrition advice.'}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={getQuickTip}
                disabled={isLoadingTip}
                className="mt-4 w-full h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoadingTip ? 'animate-spin' : ''} />
                {language === 'bn' ? 'নতুন টিপস পান' : 'Get New Tip'}
              </button>
            </div>

            {/* Nutrition Tips */}
            <section>
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <Apple size={20} className="text-green-600" />
                {t.nutritionGuide}
              </h3>
              <div className="space-y-3">
                {nutritionTips.map((tip, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-all">
                    <div className={`w-14 h-14 ${tip.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <div className={`w-10 h-10 bg-gradient-to-br ${tip.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <tip.icon size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{tip.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Care Tips */}
            <section>
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <Heart size={20} className="text-red-500" />
                {t.careTips}
              </h3>
              <div className="space-y-3">
                {careTips.map((tip, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-all">
                    <div className={`w-12 h-12 bg-gradient-to-br ${tip.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <tip.icon size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{tip.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ==================== MEAL PLAN TAB ==================== */}
        {activeTab === 'mealplan' && (
          <>
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-xl shadow-amber-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <ChefHat size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{language === 'bn' ? 'খাদ্য তালিকা' : 'Meal Plan'}</h3>
                  <p className="text-sm opacity-80">{language === 'bn' ? 'আপনার জন্য ব্যক্তিগতকৃত' : 'Personalized for you'}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={generateMealPlan}
                  disabled={isLoadingMealPlan}
                  className="flex-1 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={18} className={isLoadingMealPlan ? 'animate-spin' : ''} />
                  {language === 'bn' ? 'AI তালিকা' : 'AI Plan'}
                </button>
                <button
                  onClick={() => setMealPlan(getDefaultMealPlan())}
                  className="flex-1 h-12 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Utensils size={18} />
                  {language === 'bn' ? 'ডিফল্ট' : 'Default'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                  <button 
                    onClick={() => { setError(null); setMealPlan(getDefaultMealPlan()); }}
                    className="text-red-600 text-xs font-bold mt-2 underline"
                  >
                    {language === 'bn' ? 'ডিফল্ট তালিকা দেখুন' : 'View default meal plan'}
                  </button>
                </div>
              </div>
            )}

            {isLoadingMealPlan ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-amber-200 animate-pulse">
                  <ChefHat size={32} className="text-white" />
                </div>
                <p className="text-gray-600 font-medium">{language === 'bn' ? 'আপনার খাদ্য তালিকা তৈরি হচ্ছে...' : 'Creating your meal plan...'}</p>
                <Loader2 size={24} className="animate-spin text-amber-500 mt-3" />
              </div>
            ) : mealPlan ? (
              <div className="space-y-3">
                {Object.entries(mealPlan).filter(([key]) => key !== 'tips').map(([key, value]) => {
                  const Icon = mealIcons[key as keyof typeof mealIcons] || Utensils;
                  const label = mealLabels[key as keyof typeof mealLabels] || key;
                  const time = mealTimes[key as keyof typeof mealTimes];
                  
                  return (
                    <div key={key} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon size={24} className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-800">{label}</h4>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock size={10} />
                              {time}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{value as string}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {mealPlan.tips && mealPlan.tips.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border-2 border-green-100 mt-4">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                      <Target size={18} />
                      {language === 'bn' ? 'আজকের টিপস' : "Today's Tips"}
                    </h4>
                    <ul className="space-y-2">
                      {mealPlan.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChefHat size={32} className="text-amber-500" />
                </div>
                <p className="text-gray-600 font-medium mb-2">
                  {language === 'bn' ? 'খাদ্য তালিকা তৈরি করুন' : 'Create Your Meal Plan'}
                </p>
                <button
                  onClick={() => setMealPlan(getDefaultMealPlan())}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-all"
                >
                  {language === 'bn' ? 'ডিফল্ট তালিকা দেখুন' : 'View Default Plan'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ==================== FOOD CHECK TAB ==================== */}
        {activeTab === 'foodcheck' && (
          <>
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl p-5 text-white shadow-xl shadow-teal-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{language === 'bn' ? 'খাবার সতর্কতা' : 'Food Safety'}</h3>
                  <p className="text-sm opacity-80">{language === 'bn' ? 'খাবারের নিরাপত্তা যাচাই করুন' : 'Check if food is safe'}</p>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-1000"></div>
              <div className="relative flex gap-2">
                <input 
                  type="text" 
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkFood()}
                  placeholder={language === 'bn' ? 'খাবারের নাম লিখুন...' : 'Enter food name...'}
                  className="flex-1 bg-white border-2 border-gray-100 rounded-xl py-3 px-4 shadow-sm focus:border-teal-300 focus:outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                />
                <button 
                  onClick={() => checkFood()}
                  disabled={isCheckingFood}
                  className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-teal-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {isCheckingFood ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
              </div>
            </div>

            {/* Result */}
            {foodResult && (
              <div className={`p-5 rounded-2xl border-2 animate-in zoom-in duration-300 shadow-lg ${
                foodResult.status === 'SAFE' ? 'bg-green-50 border-green-200 text-green-900' :
                foodResult.status === 'AVOID' ? 'bg-red-50 border-red-200 text-red-900' :
                'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${
                    foodResult.status === 'SAFE' ? 'bg-green-500 text-white' :
                    foodResult.status === 'AVOID' ? 'bg-red-500 text-white' :
                    'bg-amber-500 text-white'
                  }`}>
                    {foodResult.status === 'SAFE' && <CheckCircle2 size={20} />}
                    {foodResult.status === 'AVOID' && <XCircle size={20} />}
                    {foodResult.status === 'CAUTION' && <AlertTriangle size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      {foodResult.status === 'SAFE' ? (language === 'bn' ? 'নিরাপদ' : 'Safe') :
                       foodResult.status === 'AVOID' ? (language === 'bn' ? 'এড়িয়ে চলুন' : 'Avoid') :
                       (language === 'bn' ? 'সতর্কতা' : 'Caution')}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">{language === 'bn' ? 'AI বিশ্লেষণ' : 'AI Analysis'}</p>
                  </div>
                </div>
                <p className="leading-relaxed font-medium text-sm">{foodResult.text}</p>
              </div>
            )}

            {/* Common Concerns */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-3 bg-teal-500 rounded-full" />
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">{t.commonConcerns}</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {commonFoodConcerns.map(f => (
                  <button 
                    key={f}
                    onClick={() => { setFoodQuery(f); checkFood(f); }}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:border-teal-200 hover:shadow-md transition-all text-left shadow-sm active:scale-95 group"
                  >
                    <div className="flex justify-between items-center">
                      <span>{f}</span>
                      <Search size={12} className="text-gray-300 group-hover:text-teal-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 font-bold italic leading-relaxed">
                  {language === 'bn' 
                    ? "সতর্কতা: এটি সাধারণ তথ্যের জন্য। গর্ভাবস্থায় যেকোনো খাবার খাওয়ার আগে আপনার ডাক্তারের পরামর্শ নিন।" 
                    : "Disclaimer: This is for general information only. Always consult your doctor."}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ==================== ASK AI TAB ==================== */}
        {activeTab === 'ask' && (
          <>
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl p-5 text-white shadow-xl shadow-violet-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <MessageCircle size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{language === 'bn' ? 'পুষ্টি সম্পর্কে জিজ্ঞাসা করুন' : 'Ask About Nutrition'}</h3>
                  <p className="text-sm opacity-80">{language === 'bn' ? 'AI আপনার প্রশ্নের উত্তর দেবে' : 'AI will answer your questions'}</p>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                  placeholder={language === 'bn' ? 'আপনার প্রশ্ন লিখুন...' : 'Type your question...'}
                  className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-violet-300 focus:bg-white outline-none text-gray-800 font-medium transition-all"
                />
                <button
                  onClick={askQuestion}
                  disabled={!question.trim() || isAsking}
                  className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isAsking ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>

            {/* Quick Questions */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                {language === 'bn' ? 'দ্রুত প্রশ্ন' : 'Quick Questions'}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="space-y-4">
                {chatHistory.map((chat, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-[85%] shadow-lg">
                        <p className="text-sm">{chat.question}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-md max-w-[85%] shadow-sm border border-gray-100">
                        {chat.isLoading ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">{language === 'bn' ? 'উত্তর লোড হচ্ছে...' : 'Loading answer...'}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed">{chat.answer}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {chatHistory.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-violet-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  {language === 'bn' 
                    ? 'পুষ্টি বা খাবার সম্পর্কে যেকোনো প্রশ্ন জিজ্ঞাসা করুন'
                    : 'Ask any question about nutrition or food safety'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NutritionCare;

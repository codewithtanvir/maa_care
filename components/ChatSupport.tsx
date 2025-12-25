
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Camera, X, Trash2, ArrowLeft } from 'lucide-react';
import { Message, Language, UserProfile } from '../types';
import { getAIChatResponse } from '../services/geminiService';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const ChatSupport: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language;
  const t = translations[language || 'en'] || translations.en;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, [user.id]);

  const fetchChatHistory = async () => {
    if (!user.id) return;
    setIsFetching(true);
    setMessages([]); // Clear previous messages to prevent flicker between accounts
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (data && data.length > 0) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.timestamp).getTime(),
          image: m.image_url || undefined
        })));
      } else {
        setMessages([
          { 
            id: '1', 
            role: 'assistant', 
            content: language === 'bn' 
              ? 'হ্যালো! আমি Maa Care AI। আপনি চাইলে কোনো ছবি তুলেও আমাকে জিজ্ঞাসা করতে পারেন!' 
              : 'Hi! I’m Maa Care AI. Feel free to upload a photo of your ultrasound or a symptom for me to analyze!', 
            timestamp: Date.now() 
          }
        ]);
      }
    } catch (e) {
      console.error("Error fetching chat", e);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || !user.id) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input || (language === 'bn' ? 'ছবিটি বিশ্লেষণ করুন' : 'Analyze this image'), 
      timestamp: Date.now(),
      image: selectedImage || undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Save user message to Supabase
      const { error: userMsgError } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: userMsg.content,
        image_url: userMsg.image,
        timestamp: new Date(userMsg.timestamp).toISOString()
      });
      
      if (userMsgError) {
        console.error("Error saving user message:", userMsgError);
      }

      const history = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const response = await getAIChatResponse(history, currentInput || "Analyze this image", user, currentImage || undefined);
      
      const assistantMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      // Save assistant message to Supabase
      const { error: assistantMsgError } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: assistantMsg.content,
        timestamp: new Date(assistantMsg.timestamp).toISOString()
      });
      
      if (assistantMsgError) {
        console.error("Error saving assistant message:", assistantMsgError);
      }

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'bn' ? 'দুঃখিত, আমি এখন উত্তর দিতে পারছি না।' : 'Sorry, I cannot respond right now.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (window.confirm(language === 'bn' ? 'আপনি কি পুরো চ্যাট মুছতে চান?' : 'Clear all chat history?')) {
      if (!user.id) return;
      try {
        await supabase.from('chat_messages').delete().eq('user_id', user.id);
        const defaultMsg: Message = { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: language === 'bn' ? 'চ্যাট মুছে ফেলা হয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?' : 'Chat cleared. How can I help you today?', 
          timestamp: Date.now() 
        };
        setMessages([defaultMsg]);
      } catch (e) {
        console.error("Error clearing chat", e);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Clear Action */}
      <div className="px-4 py-2 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-pink-50 rounded-full transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Maa Care AI Support</span>
        </div>
        <button 
          onClick={clearChat}
          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
          title="Clear History"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-indigo-100 shadow-sm' : 'bg-pink-100 shadow-sm'}`}>
                {m.role === 'user' ? <User size={16} className="text-indigo-500" /> : <Bot size={16} className="text-pink-500" />}
              </div>
              <div className={`space-y-2 p-4 rounded-2xl text-sm shadow-sm border ${
                m.role === 'user' ? 'bg-indigo-500 text-white border-indigo-400 rounded-tr-none' : 'bg-white text-gray-800 border-pink-50 rounded-tl-none'
              }`}>
                {m.image && (
                  <div className="relative overflow-hidden rounded-lg mb-2 border-2 border-white/20">
                    <img src={m.image} alt="User upload" className="max-h-64 w-full object-contain bg-black/5" />
                  </div>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                <div className={`text-[10px] opacity-70 mt-1 font-bold ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in slide-in-from-left-4 duration-300">
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-100"><Bot size={16} className="text-pink-500" /></div>
                <div className="p-4 rounded-2xl bg-white border border-pink-50 flex gap-1.5 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce [animation-duration:800ms]" />
                  <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:200ms]" />
                  <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce [animation-duration:800ms] [animation-delay:400ms]" />
                </div>
             </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-3">
        {selectedImage && (
          <div className="relative inline-block group">
            <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-pink-400 shadow-lg transition-transform group-hover:scale-105">
              <img src={selectedImage} alt="Selected" className="h-full w-full object-cover" />
            </div>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 active:scale-90 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-pink-50 hover:text-pink-500 active:scale-95 transition-all border border-transparent hover:border-pink-100"
          >
            <Camera size={22} />
          </button>
          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />
          
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.typeMessage}
              className="w-full bg-gray-50 border border-gray-200 rounded-[1.5rem] py-4 px-6 pr-14 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white focus:border-transparent transition-all font-medium text-gray-700 shadow-inner"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="absolute right-2 top-2 p-2.5 bg-pink-500 text-white rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-lg shadow-pink-100"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;

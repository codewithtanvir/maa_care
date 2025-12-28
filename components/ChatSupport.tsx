
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Camera, X, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { Message, Language, UserProfile, View } from '../types';
import { getAIChatResponse } from '../services/geminiService';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

// Format AI response with markdown-like styling
const formatMessage = (text: string, isUser: boolean): React.ReactNode => {
  if (isUser) return text;
  
  // Split by lines and process
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-1.5 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-pink-400 mt-1">•</span>
              <span>{formatInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };
  
  const formatInlineText = (line: string): React.ReactNode => {
    // Handle bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Headers (### or ##)
    if (trimmed.startsWith('###')) {
      flushList();
      elements.push(
        <h4 key={index} className="font-bold text-pink-600 text-xs uppercase tracking-wider mt-3 mb-1.5">
          {formatInlineText(trimmed.replace(/^#+\s*/, ''))}
        </h4>
      );
    } else if (trimmed.startsWith('##')) {
      flushList();
      elements.push(
        <h3 key={index} className="font-bold text-gray-800 mt-3 mb-1.5">
          {formatInlineText(trimmed.replace(/^#+\s*/, ''))}
        </h3>
      );
    }
    // Bullet points (-, *, •)
    else if (/^[-*•]\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*•]\s*/, ''));
    }
    // Numbered list
    else if (/^\d+[.)\s]/.test(trimmed)) {
      flushList();
      elements.push(
        <div key={index} className="flex items-start gap-2 my-1">
          <span className="text-pink-500 font-semibold min-w-[1.25rem]">{trimmed.match(/^\d+/)?.[0]}.</span>
          <span>{formatInlineText(trimmed.replace(/^\d+[.)\s]+/, ''))}</span>
        </div>
      );
    }
    // Status line [STATUS]
    else if (trimmed.startsWith('[') && trimmed.includes(']')) {
      flushList();
      const status = trimmed.match(/\[([^\]]+)\]/)?.[1] || '';
      const rest = trimmed.replace(/\[[^\]]+\]\s*[-:]?\s*/, '');
      const statusColor = status.toLowerCase().includes('normal') || status.toLowerCase().includes('safe') 
        ? 'bg-green-100 text-green-700' 
        : status.toLowerCase().includes('warning') || status.toLowerCase().includes('caution')
        ? 'bg-amber-100 text-amber-700'
        : 'bg-pink-100 text-pink-700';
      elements.push(
        <div key={index} className="flex items-center gap-2 my-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor}`}>{status}</span>
          {rest && <span className="text-gray-600">{rest}</span>}
        </div>
      );
    }
    // Empty line
    else if (trimmed === '') {
      flushList();
      if (elements.length > 0) {
        elements.push(<div key={index} className="h-2" />);
      }
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p key={index} className="leading-relaxed">
          {formatInlineText(trimmed)}
        </p>
      );
    }
  });
  
  flushList();
  return <div className="space-y-1">{elements}</div>;
};

interface Props {
  user: UserProfile;
  onBack: () => void;
  onNavigate?: (view: View) => void;
}

const ChatSupport: React.FC<Props> = ({ user, onBack, onNavigate }) => {
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
    <div className="flex flex-col h-full bg-gradient-to-b from-pink-50/50 to-white">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-pink-100/50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 hover:bg-pink-50 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Maa Care AI</h1>
              <p className="text-[10px] text-pink-500 font-semibold">{language === 'bn' ? 'সবসময় আপনার সাথে' : 'Always here for you'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title={language === 'bn' ? 'চ্যাট মুছুন' : 'Clear History'}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-2.5 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                m.role === 'user' 
                  ? 'bg-gradient-to-br from-rose-400 to-pink-500' 
                  : 'bg-gradient-to-br from-pink-100 to-rose-100'
              }`}>
                {m.role === 'user' 
                  ? <User size={14} className="text-white" /> 
                  : <Bot size={14} className="text-pink-600" />
                }
              </div>
              <div className={`px-4 py-3 text-sm ${
                m.role === 'user' 
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl rounded-tr-md shadow-lg shadow-pink-200/50' 
                  : 'bg-white text-gray-700 rounded-2xl rounded-tl-md shadow-md border border-pink-50'
              }`}>
                {m.image && (
                  <div className="relative overflow-hidden rounded-xl mb-2">
                    <img src={m.image} alt="User upload" className="max-h-48 w-full object-contain bg-black/5 rounded-lg" />
                  </div>
                )}
                <div className="leading-relaxed">
                  {formatMessage(m.content, m.role === 'user')}
                </div>
                <p className={`text-[10px] font-medium mt-2 ${m.role === 'user' ? 'text-white/70 text-right' : 'text-gray-400'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100 shadow-sm">
                <Bot size={14} className="text-pink-600" />
              </div>
              <div className="px-5 py-4 rounded-2xl rounded-tl-md bg-white border border-pink-50 flex gap-1.5 items-center shadow-md">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-duration:600ms]" />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-duration:600ms] [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-duration:600ms] [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-pink-100/50 space-y-3">
        {selectedImage && (
          <div className="relative inline-block">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-pink-400 shadow-lg">
              <img src={selectedImage} alt="Selected" className="h-full w-full object-cover" />
            </div>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 active:scale-90 transition-all"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-100 active:scale-95 transition-all"
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
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white focus:border-transparent transition-all font-medium text-gray-700"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="absolute right-1.5 top-1.5 p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-xl disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-pink-200"
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

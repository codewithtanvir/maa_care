
import { Language, UserProfile } from "../types";
import { 
  generateAIResponse, 
  buildMaternitySystemInstruction, 
  isAIServiceAvailable,
  ChatMessage
} from "./aiService";

/**
 * Unified Gemini Service - Now powered by multi-provider AI service
 * Automatically falls back between Gemini, OpenAI, Groq, Anthropic, and OpenRouter
 */

/**
 * Generates a response from Maa Care AI for the chat support feature.
 * Uses unified AI service with automatic multi-provider fallback.
 */
export const getAIChatResponse = async (
  history: { role: 'user' | 'model' | 'assistant', parts?: any[], content?: string }[], 
  prompt: string, 
  user: UserProfile, 
  imageData?: string
): Promise<string> => {
  const language = user.language || 'en';
  
  if (!isAIServiceAvailable()) {
    return language === 'bn' 
      ? "দুঃখিত, AI সেবা বর্তমানে উপলব্ধ নেই। .env ফাইলে API কী যোগ করুন।"
      : "Sorry, AI service is currently unavailable. Please add API keys to .env file.";
  }

  try {
    const systemInstruction = buildMaternitySystemInstruction(user, language);
    
    const messages: ChatMessage[] = history.map(h => ({
      role: h.role === 'model' ? 'assistant' as const : h.role as 'user' | 'assistant',
      content: h.content || (h.parts?.[0]?.text || ''),
      parts: h.parts
    }));

    messages.push({
      role: 'user',
      content: `${prompt}\n\nResponse Language: ${language === 'bn' ? 'Bengali' : 'English'}`,
      image: imageData
    });

    const response = await generateAIResponse({
      messages,
      systemInstruction,
      temperature: 0.8,
      maxTokens: 2048,
      imageData
    });

    return response.content;

  } catch (error: any) {
    console.error('[Chat] AI Error:', error.message);
    return language === 'bn' 
      ? "দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।"
      : "Sorry, I cannot respond right now. Please try again.";
  }
};

/**
 * Analyzes symptoms for the Symptoms Checker feature.
 */
export const checkSymptomsAI = async (user: UserProfile, symptoms: string[], notes: string): Promise<string> => {
  const language = user.language || 'en';
  const week = user.currentWeek || 1;
  const userContext = `User Profile: Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Blood Group: ${user.bloodGroup || 'N/A'}, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;

  const systemInstruction = language === 'bn'
    ? `আপনি একজন বিশেষজ্ঞ বাংলাদেশী মাতৃত্বকালীন নার্স। ${userContext} ব্যবহারকারীর লক্ষণগুলো বিশ্লেষণ করুন।
       আপনার উত্তরটি অবশ্যই এই ফরম্যাটে হতে হবে:
       [STATUS] - সংক্ষেপে এক লাইনে ব্যাখ্যা।
       
       ### বিশ্লেষণ
       সপ্তাহ ${week}-এ এই লক্ষণগুলো কেন হতে পারে তার সহজ ব্যাখ্যা।
       
       ### করণীয় এবং ঘরোয়া প্রতিকার
       নিরাপদ বাংলাদেশী ঘরোয়া টিপস (যেমন গরম জল, আদা, বা বিশ্রাম)।
       
       ### কখন ডাক্তার ডাকবেন
       গুরুতর লাল পতাকা বা রেড ফ্ল্যাগগুলো কী কী।`
    : `You are a specialist Bangladeshi maternity nurse. ${userContext} Analyze the symptoms provided.
       Your response MUST follow this structure:
       [STATUS] - A concise one-line overall assessment.
       
       ### Analysis
       A gentle explanation of why these symptoms might occur in Week ${week}.
       
       ### Recommendations & Home Care
       Safe cultural or lifestyle tips (e.g., specific positions, hydration, local foods like ginger/lemon).
       
       ### Warning Signs
       Specific 'Red Flags' where the user should stop monitoring and call a doctor immediately.`;

  try {
    const response = await generateAIResponse({
      messages: [{
        role: 'user',
        content: `Pregnancy Week: ${week}. Symptoms: ${symptoms.join(', ')}. Additional Notes: ${notes}. Analyze these for a mother in Bangladesh. Use ${language === 'bn' ? 'Bengali' : 'English'}.`
      }],
      systemInstruction,
      temperature: 0.7,
      maxTokens: 1024
    });

    return response.content;
  } catch (error) {
    console.error('[Symptoms] AI Error:', error);
    return "[ERROR]";
  }
};

/**
 * Provides a personalized daily insight for the dashboard.
 */
export const getDashboardInsight = async (user: UserProfile, logs: any[]): Promise<string | null> => {
  const language = user.language || 'en';
  const week = user.currentWeek || 1;
  const name = user.name || 'Mama';
  const userContext = `User Profile: Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Blood Group: ${user.bloodGroup || 'N/A'}, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;
  
  const logsSummary = logs.length > 0 
    ? "Recent health logs: " + logs.slice(0, 3).map(l => `Mood: ${l.mood}, Symptoms: ${l.symptoms.join(', ')}, BP: ${l.bloodPressure || 'N/A'}, Glucose: ${l.glucose || 'N/A'}`).join('; ')
    : "No recent health logs recorded.";
    
  const systemInstruction = language === 'bn'
    ? `আপনি 'Maa Care AI', একজন বিশেষজ্ঞ মাতৃত্বকালীন সঙ্গী। আপনি ${name}-কে তার গর্ভাবস্থার ${week} সপ্তাহে ব্যক্তিগতকৃত পরামর্শ দিচ্ছেন। ${userContext} আপনার পরামর্শগুলো বাংলাদেশের আবহাওয়া, স্থানীয় খাবার (যেমন ডাব, শাক-সবজি, দেশি মাছ) এবং সংস্কৃতির সাথে সামঞ্জস্যপূর্ণ হতে হবে।`
    : `You are 'Maa Care AI', an expert maternity companion. You are giving personalized advice to ${name} who is in week ${week} of pregnancy. ${userContext} Your tips must consider Bangladeshi weather, local diet (e.g., coconut water, local greens, fish), and cultural context.`;

  try {
    const response = await generateAIResponse({
      messages: [{
        role: 'user',
        content: `User Info: Name: ${name}, Week: ${week}. ${logsSummary}. Based on this, give a highly accurate, warm, and personalized daily tip. If there are symptoms like nausea or fatigue in the logs, address them gently. Keep it to 1-2 sentences. Language: ${language === 'bn' ? 'Bengali' : 'English'}.`
      }],
      systemInstruction,
      temperature: 0.8,
      maxTokens: 256
    });

    return response.content;
  } catch (error) {
    console.error('[Dashboard] AI Error:', error);
    return null;
  }
};

/**
 * Analyzes health logs to provide supportive wellness tips.
 */
export const getHealthInsight = async (user: UserProfile, logs: any[]): Promise<string | null> => {
  const language = user.language || 'en';
  const name = user.name || 'Mama';
  const week = user.currentWeek || 1;
  const userContext = `User Profile: Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Blood Group: ${user.bloodGroup || 'N/A'}, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;
  const logsSummary = logs.map(l => `Date: ${l.date}, Mood: ${l.mood}, Symptoms: ${l.symptoms.join(', ')}, BP: ${l.bloodPressure || 'N/A'}, Glucose: ${l.glucose || 'N/A'}`).join('; ');
  
  const systemInstruction = language === 'bn'
    ? `আপনি 'Maa Care AI', একজন বিশেষজ্ঞ মাতৃত্বকালীন সঙ্গী। আপনি ${name}-কে তার গর্ভাবস্থার ${week} সপ্তাহে তার স্বাস্থ্য ডায়েরি বিশ্লেষণ করে পরামর্শ দিচ্ছেন। ${userContext} আপনার পরামর্শগুলো বাংলাদেশের প্রেক্ষাপটে হতে হবে।`
    : `You are 'Maa Care AI', an expert maternity companion. You are analyzing health logs for ${name} (Week ${week}) and providing wellness tips tailored to the Bangladeshi context. ${userContext}`;

  try {
    const response = await generateAIResponse({
      messages: [{
        role: 'user',
        content: `Health Logs: ${logsSummary}. Provide a supportive, accurate wellness tip based on these logs. If the user is feeling tired or nauseous, suggest local remedies like ginger tea or small frequent meals. Keep it to 1-2 sentences. Language: ${language === 'bn' ? 'Bengali' : 'English'}.`
      }],
      systemInstruction,
      temperature: 0.7,
      maxTokens: 256
    });

    return response.content;
  } catch (error) {
    console.error('[Health Insight] AI Error:', error);
    return null;
  }
};

/**
 * Provides baby development information for a specific pregnancy week.
 */
export const getBabyDevelopmentInfo = async (week: number, language: Language = 'en'): Promise<string | null> => {
  try {
    const response = await generateAIResponse({
      messages: [{
        role: 'user',
        content: language === 'bn'
          ? `গর্ভাবস্থার ${week} সপ্তাহে শিশুর বিকাশ সম্পর্কে একটি সংক্ষিপ্ত এবং সুন্দর বর্ণনা দিন। শিশুটি এখন দেখতে কেমন এবং কী কী নতুন অঙ্গ বা ক্ষমতা তৈরি হয়েছে তা ১-২ বাক্যে লিখুন। ভাষা: বাংলা।`
          : `Give a short, beautiful description of baby's development at week ${week} of pregnancy. Describe what the baby looks like and what new organs or abilities have developed in 1-2 sentences. Language: English.`
      }],
      temperature: 0.7,
      maxTokens: 256
    });

    return response.content;
  } catch (error) {
    console.error('[Baby Dev] AI Error:', error);
    return null;
  }
};

// Audio utility functions (unchanged)
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const frameCount = Math.floor(data.byteLength / (2 * numChannels));
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      const offset = (i * numChannels + channel) * 2;
      if (offset + 1 < data.byteLength) {
        channelData[i] = view.getInt16(offset, true) / 32768.0;
      }
    }
  }
  return buffer;
}

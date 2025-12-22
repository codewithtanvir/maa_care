
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import OpenAI from "openai";
import { Language, UserProfile } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const isOpenRouter = OPENAI_API_KEY.startsWith("sk-or-");
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
  dangerouslyAllowBrowser: true,
  defaultHeaders: isOpenRouter ? {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Maa Care",
  } : undefined
});
/**
 * Generates a response from Maa Care AI for the chat support feature.
 * Supports both Gemini and OpenAI with fallback logic.
 */
export const getAIChatResponse = async (history: { role: 'user' | 'model' | 'assistant', parts?: any[], content?: string }[], prompt: string, user: UserProfile, imageData?: string) => {
  const language = user.language || 'en';
  const userContext = `User Profile: Name: ${user.name}, Week: ${user.currentWeek}, Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;
  
  const systemInstruction = language === 'bn' 
    ? `আপনি একজন অভিজ্ঞ বাংলাদেশী মাতৃত্বকালীন সঙ্গী এবং নার্স যার নাম 'Maa Care AI'। ${userContext} আপনি বাংলাদেশের প্রেক্ষাপটে উষ্ণ, বড় বোনের মতো (Apu/Didi) পরামর্শ প্রদান করেন। আপনি জানেন বাংলাদেশের সাধারণ খাবার (যেমন মাছ, ভাত, ডাল, শাক) এবং স্থানীয় প্রচলিত ধারণাগুলো সম্পর্কে। বিজ্ঞানভিত্তিক তথ্যের পাশাপাশি সহানুভূতি দিয়ে কথা বলুন। জরুরি সমস্যায় সর্বদা ডাক্তার দেখানোর পরামর্শ দেবেন।`
    : `You are an experienced Bangladeshi maternity companion named 'Maa Care AI'. ${userContext} Provide warm, sisterly advice tailored to the Bangladeshi context (covering local diet like fish, lentils, and greens). Combine evidence-based advice with local cultural empathy. Always remind users to consult a local doctor for medical emergencies.`;

  // Try Gemini first
  if (API_KEY && !API_KEY.startsWith("sk-or-")) {
    try {
      console.log("Attempting Gemini Chat...");
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const contents: any[] = history.map(h => ({
        role: (h.role === 'assistant' || h.role === 'model') ? 'model' : 'user',
        parts: h.parts || [{ text: h.content || "" }]
      }));
      
      const currentParts: any[] = [{ text: prompt }];
      if (imageData) {
        currentParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData.split(',')[1],
          },
        });
      }
      
      contents.push({ role: 'user', parts: currentParts });

      // Ensure alternating roles for Gemini API
      let validContents: any[] = [];
      contents.forEach((msg) => {
        if (validContents.length > 0 && validContents[validContents.length - 1].role === msg.role) {
          validContents[validContents.length - 1] = msg;
        } else {
          validContents.push(msg);
        }
      });

      if (validContents.length > 0 && validContents[0].role === 'model') {
        validContents.shift();
      }

      console.log("Gemini Contents:", JSON.stringify(validContents));

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: validContents,
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] }
        }
      });

      if (response && response.text) {
        console.log("Gemini Success");
        return response.text;
      }
    } catch (error) {
      console.error("Gemini Chat Error, falling back to OpenAI/OpenRouter:", error);
    }
  }

  // Fallback to OpenAI / OpenRouter
  if (OPENAI_API_KEY) {
    try {
      console.log("Attempting OpenAI/OpenRouter Chat...");
      const messages: any[] = [
        { role: "system", content: systemInstruction },
        ...history.map(h => ({
          role: h.role === 'model' ? 'assistant' : h.role,
          content: h.content || (h.parts?.[0]?.text || "")
        })),
        { role: "user", content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: isOpenRouter ? "google/gemini-2.0-flash-001" : "gpt-4o-mini",
        messages: messages,
      });

      if (response.choices[0].message.content) {
        console.log("OpenAI/OpenRouter Success");
        return response.choices[0].message.content;
      }
    } catch (error) {
      console.error("OpenAI/OpenRouter Chat Error:", error);
    }
  }

  return language === 'bn' ? "দুঃখিত, আমি এখন উত্তর দিতে পারছি না।" : "Sorry, I cannot respond right now.";
};

/**
 * Analyzes symptoms for the Symptoms Checker feature with a more structured and comprehensive output.
 */
export const checkSymptomsAI = async (user: UserProfile, symptoms: string[], notes: string) => {
  const language = user.language || 'en';
  const week = user.currentWeek || 1;
  const userContext = `User Profile: Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;

  const systemInstruction = language === 'bn'
    ? `আপনি একজন বিশেষজ্ঞ বাংলাদেশী মাতৃত্বকালীন নার্স। ${userContext} ব্যবহারকারীর লক্ষণগুলো বিশ্লেষণ করুন।
       আপনার উত্তরটি অবশ্যই এই ফরম্যাটে হতে হবে:
       [STATUS] - সংক্ষেপে এক লাইনে ব্যাখ্যা।
       
       ### বিশ্লেষণ
       সপ্তাহ ${week}-এ এই লক্ষণগুলো কেন হতে পারে তার সহজ ব্যাখ্যা।
       
       ### করণীয় এবং ঘরোয়া প্রতিকার
       নিরাপদ বাংলাদেশী ঘরোয়া টিপস (যেমন গরম জল, আদা, বা বিশ্রাম)।
       
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

  const prompt = `Pregnancy Week: ${week}. Symptoms: ${symptoms.join(', ')}. Additional Notes: ${notes}. Analyze these for a mother in Bangladesh. Use ${language === 'bn' ? 'Bengali' : 'English'}.`;

  // Try Gemini
  if (API_KEY && !API_KEY.startsWith("sk-or-")) {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] }
        }
      });
      if (response && response.text) return response.text;
    } catch (error) {
      console.error("Gemini Symptom Error, falling back to OpenAI/OpenRouter:", error);
    }
  }

  // Fallback to OpenAI / OpenRouter
  if (OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: isOpenRouter ? "google/gemini-2.0-flash-001" : "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI/OpenRouter Symptom Error:", error);
    }
  }

  return "[ERROR]";
};

/**
 * Provides a personalized daily insight for the dashboard with local context.
 */
export const getDashboardInsight = async (user: UserProfile, logs: any[]) => {
  const language = user.language || 'en';
  const week = user.currentWeek || 1;
  const name = user.name || 'Mama';
  const userContext = `User Profile: Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;
  
  const logsSummary = logs.length > 0 
    ? "Recent health logs: " + logs.slice(0, 3).map(l => `Mood: ${l.mood}, Symptoms: ${l.symptoms.join(', ')}`).join('; ')
    : "No recent health logs recorded.";
    
  const systemInstruction = language === 'bn'
    ? `আপনি 'Maa Care AI', একজন বিশেষজ্ঞ মাতৃত্বকালীন সঙ্গী। আপনি ${name}-কে তার গর্ভাবস্থার ${week} সপ্তাহে ব্যক্তিগতকৃত পরামর্শ দিচ্ছেন। ${userContext} আপনার পরামর্শগুলো বাংলাদেশের আবহাওয়া, স্থানীয় খাবার (যেমন ডাব, শাক-সবজি, দেশি মাছ) এবং সংস্কৃতির সাথে সামঞ্জস্যপূর্ণ হতে হবে।`
    : `You are 'Maa Care AI', an expert maternity companion. You are giving personalized advice to ${name} who is in week ${week} of pregnancy. ${userContext} Your tips must consider Bangladeshi weather, local diet (e.g., coconut water, local greens, fish), and cultural context.`;

  const prompt = `User Info: Name: ${name}, Week: ${week}. ${logsSummary}. 
    Based on this, give a highly accurate, warm, and personalized daily tip. 
    If there are symptoms like nausea or fatigue in the logs, address them gently. 
    Keep it to 1-2 sentences. Language: ${language === 'bn' ? 'Bengali' : 'English'}.`;

  // Try Gemini
  if (API_KEY && !API_KEY.startsWith("sk-or-")) {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] }
        }
      });
      if (response && response.text) return response.text;
    } catch (error) {
      console.error("Gemini Insight Error, falling back to OpenAI/OpenRouter:", error);
    }
  }

  // Fallback to OpenAI / OpenRouter
  if (OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: isOpenRouter ? "google/gemini-2.0-flash-001" : "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI/OpenRouter Insight Error:", error);
    }
  }

  return null;
};

/**
 * Analyzes health logs to provide supportive wellness tips.
 */
export const getHealthInsight = async (user: UserProfile, logs: any[]) => {
  const language = user.language || 'en';
  const name = user.name || 'Mama';
  const week = user.currentWeek || 1;
  const userContext = `User Profile: Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;
  const logsSummary = logs.map(l => `Date: ${l.date}, Mood: ${l.mood}, Symptoms: ${l.symptoms.join(', ')}`).join('; ');
  
  const systemInstruction = language === 'bn'
    ? `আপনি 'Maa Care AI', একজন বিশেষজ্ঞ মাতৃত্বকালীন সঙ্গী। আপনি ${name}-কে তার গর্ভাবস্থার ${week} সপ্তাহে তার স্বাস্থ্য ডায়েরি বিশ্লেষণ করে পরামর্শ দিচ্ছেন। ${userContext} আপনার পরামর্শগুলো বাংলাদেশের প্রেক্ষাপটে হতে হবে।`
    : `You are 'Maa Care AI', an expert maternity companion. You are analyzing health logs for ${name} (Week ${week}) and providing wellness tips tailored to the Bangladeshi context. ${userContext}`;

  const prompt = `Health Logs: ${logsSummary}. 
    Provide a supportive, accurate wellness tip based on these logs. 
    If the user is feeling tired or nauseous, suggest local remedies like ginger tea or small frequent meals.
    Keep it to 1-2 sentences. Language: ${language === 'bn' ? 'Bengali' : 'English'}.`;
  
  // Try Gemini
  if (API_KEY && !API_KEY.startsWith("sk-or-")) {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] }
        }
      });
      if (response && response.text) return response.text;
    } catch (error) {
      console.error("Gemini Health Insight Error, falling back to OpenAI/OpenRouter:", error);
    }
  }

  // Fallback to OpenAI / OpenRouter
  if (OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: isOpenRouter ? "google/gemini-2.0-flash-001" : "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI/OpenRouter Health Insight Error:", error);
    }
  }

  return null;
};

export const generateBabyNames = async (preference: string, language: Language = 'en') => {
  const prompt = language === 'bn'
    ? `বাংলাদেশের প্রেক্ষাপটে সুন্দর ও অর্থবহ শিশুর নামের তালিকা দিন। পছন্দ: ${preference}। অর্থসহ লিখুন।`
    : `Suggest meaningful Bangladeshi baby names based on these preferences: ${preference}. Include the meaning for each name.`;

  // Try Gemini
  if (API_KEY && !API_KEY.startsWith("sk-or-")) {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      if (response && response.text) return response.text;
    } catch (error) {
      console.error("Gemini Baby Names Error, falling back to OpenAI/OpenRouter:", error);
    }
  }

  // Fallback to OpenAI / OpenRouter
  if (OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: isOpenRouter ? "google/gemini-2.0-flash-001" : "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI/OpenRouter Baby Names Error:", error);
    }
  }

  return null;
};

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
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

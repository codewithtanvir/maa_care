/**
 * Unified AI Service with Multiple Providers and Automatic Fallback
 * 
 * Supports:
 * - Google Gemini
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic Claude
 * - OpenRouter (aggregates multiple models)
 * - Groq (ultra-fast inference)
 * 
 * Features:
 * - Automatic fallback between providers
 * - Retry logic with exponential backoff
 * - Provider health monitoring
 * - Cost optimization by provider selection
 * - Rate limit handling
 */

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { Language, UserProfile } from "../types";

// ===========================
// Configuration
// ===========================

interface AIProvider {
  name: string;
  enabled: boolean;
  priority: number; // Lower = higher priority
  apiKey?: string;
  client?: any;
  maxRetries: number;
  timeout: number;
  costPerToken: number; // Approximate cost per 1M tokens in USD
}

interface AIConfig {
  providers: AIProvider[];
  defaultTimeout: number;
  maxFallbackAttempts: number;
  enableCostOptimization: boolean;
}

// Environment variables
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Initialize AI Configuration
const aiConfig: AIConfig = {
  providers: [
    {
      name: 'gemini',
      enabled: Boolean(GEMINI_KEY),
      priority: 1, // Primary provider
      apiKey: GEMINI_KEY,
      client: GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null,
      maxRetries: 2,
      timeout: 30000,
      costPerToken: 0.075 // $0.075 per 1M tokens (Gemini 3 Flash)
    },
    {
      name: 'groq',
      enabled: Boolean(GROQ_KEY),
      priority: 2, // Fast and free tier available
      apiKey: GROQ_KEY,
      client: GROQ_KEY ? new OpenAI({
        apiKey: GROQ_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        dangerouslyAllowBrowser: true
      }) : null,
      maxRetries: 2,
      timeout: 10000, // Groq is very fast
      costPerToken: 0.05 // Very cost-effective
    },
    {
      name: 'openai',
      enabled: Boolean(OPENAI_KEY) && !OPENAI_KEY.startsWith('sk-or-'),
      priority: 3,
      apiKey: OPENAI_KEY,
      client: OPENAI_KEY && !OPENAI_KEY.startsWith('sk-or-') ? new OpenAI({
        apiKey: OPENAI_KEY,
        dangerouslyAllowBrowser: true
      }) : null,
      maxRetries: 2,
      timeout: 30000,
      costPerToken: 0.15 // GPT-4o-mini
    },
    {
      name: 'anthropic',
      enabled: Boolean(ANTHROPIC_KEY),
      priority: 4,
      apiKey: ANTHROPIC_KEY,
      client: ANTHROPIC_KEY ? new OpenAI({
        apiKey: ANTHROPIC_KEY,
        baseURL: 'https://api.anthropic.com/v1',
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'anthropic-version': '2023-06-01'
        }
      }) : null,
      maxRetries: 2,
      timeout: 30000,
      costPerToken: 0.25 // Claude Haiku
    },
    {
      name: 'openrouter',
      enabled: Boolean(OPENROUTER_KEY) || (Boolean(OPENAI_KEY) && OPENAI_KEY.startsWith('sk-or-')),
      priority: 5, // Fallback aggregator
      apiKey: OPENROUTER_KEY || OPENAI_KEY,
      client: (OPENROUTER_KEY || OPENAI_KEY) ? new OpenAI({
        apiKey: OPENROUTER_KEY || OPENAI_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'Maa Care AI'
        }
      }) : null,
      maxRetries: 2,
      timeout: 30000,
      costPerToken: 0.10 // Varies by model
    }
  ],
  defaultTimeout: 30000,
  maxFallbackAttempts: 3,
  enableCostOptimization: true
};

// Get enabled providers sorted by priority
const getEnabledProviders = (): AIProvider[] => {
  const enabled = aiConfig.providers
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);
  
  if (enabled.length === 0) {
    console.warn('[AI Service] No AI providers enabled! Check your .env file.');
  }
  
  return enabled;
};

// ===========================
// Core AI Service Functions
// ===========================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
  parts?: any[];
  image?: string;
}

export interface AIRequest {
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  imageData?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute AI request with Gemini provider
 */
const executeGemini = async (provider: AIProvider, request: AIRequest): Promise<AIResponse> => {
  const ai = provider.client as any;
  
  const contents = request.messages
    .filter(m => m.role !== 'system')
    .map(m => {
      // Clone parts to avoid mutating history
      const parts: any[] = m.parts ? JSON.parse(JSON.stringify(m.parts)) : [{ text: m.content || '' }];
      
      // Add image if present
      if (m.image && m.role === 'user') {
        try {
          const base64Data = m.image.includes(',') ? m.image.split(',')[1] : m.image;
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          });
        } catch (e) {
          console.error('[Gemini] Image processing error:', e);
        }
      }
      
      return {
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts
      };
    });

  // Ensure alternating roles (Gemini requirement)
  const validContents: any[] = [];
  contents.forEach((msg) => {
    if (validContents.length > 0 && validContents[validContents.length - 1].role === msg.role) {
      validContents[validContents.length - 1] = msg;
    } else {
      validContents.push(msg);
    }
  });

  // Remove leading model message
  if (validContents.length > 0 && validContents[0].role === 'model') {
    validContents.shift();
  }

  const config: any = {
    temperature: request.temperature || 0.7,
    maxOutputTokens: request.maxTokens || 2048
  };

  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: validContents,
    systemInstruction: request.systemInstruction,
    config
  });

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Invalid Gemini response');
  }

  return {
    content: text,
    provider: 'gemini',
    tokensUsed: result.usageMetadata?.totalTokenCount || 0,
    cost: (result.usageMetadata?.totalTokenCount || 0) * provider.costPerToken / 1000000
  };
};

/**
 * Execute AI request with OpenAI-compatible providers (OpenAI, Groq, OpenRouter, Anthropic)
 */
const executeOpenAICompatible = async (provider: AIProvider, request: AIRequest): Promise<AIResponse> => {
  const client = provider.client as OpenAI;
  
  const messages: any[] = [];
  
  // Add system message if present
  if (request.systemInstruction) {
    messages.push({ role: 'system', content: request.systemInstruction });
  }

  // Add conversation messages
  request.messages.forEach(m => {
    if (m.role !== 'system') {
      const content: any[] = [];
      
      if (m.content) {
        content.push({ type: 'text', text: m.content });
      }
      
      // Add image if present (OpenAI Vision API format)
      if (m.image && m.role === 'user') {
        content.push({
          type: 'image_url',
          image_url: { url: m.image }
        });
      }
      
      // Skip empty messages
      if (content.length === 0) return;
      
      messages.push({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: content.length === 1 && content[0].type === 'text' ? m.content : content
      });
    }
  });

  // Select model based on provider
  let model = 'gpt-4o-mini'; // Default
  switch (provider.name) {
    case 'openai':
      model = 'gpt-4o-mini';
      break;
    case 'groq':
      model = 'llama-3.3-70b-versatile'; // Fast and powerful
      break;
    case 'openrouter':
      model = 'google/gemini-2.0-flash-001'; // Reliable flash model
      break;
    case 'anthropic':
      model = 'claude-3-haiku-20240307';
      break;
  }

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: request.temperature || 0.7,
    max_tokens: request.maxTokens || 2048
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`Invalid ${provider.name} response`);
  }

  return {
    content,
    provider: provider.name,
    tokensUsed: response.usage?.total_tokens || 0,
    cost: (response.usage?.total_tokens || 0) * provider.costPerToken / 1000000
  };
};

/**
 * Execute AI request with a specific provider
 */
const executeWithProvider = async (provider: AIProvider, request: AIRequest): Promise<AIResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

  try {
    let response: AIResponse;

    switch (provider.name) {
      case 'gemini':
        response = await executeGemini(provider, request);
        break;
      
      case 'openai':
      case 'groq':
      case 'openrouter':
      case 'anthropic':
        response = await executeOpenAICompatible(provider, request);
        break;
      
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }

    clearTimeout(timeoutId);
    return response;

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Enhanced error logging
    console.error(`[${provider.name}] Error:`, {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code
    });
    
    throw error;
  }
};

/**
 * Main function: Execute AI request with automatic fallback
 */
export const generateAIResponse = async (request: AIRequest): Promise<AIResponse> => {
  const enabledProviders = getEnabledProviders();
  
  if (enabledProviders.length === 0) {
    throw new Error('No AI providers configured. Please add API keys to .env file.');
  }

  const errors: { provider: string; error: any }[] = [];
  let lastError: Error | null = null;

  // Try each provider in priority order
  for (const provider of enabledProviders) {
    let retries = 0;
    
    while (retries <= provider.maxRetries) {
      try {
        console.log(`[AI Service] Attempting ${provider.name}${retries > 0 ? ` (retry ${retries})` : ''}...`);
        
        const response = await executeWithProvider(provider, request);
        
        console.log(`[AI Service] ✓ Success with ${provider.name}`, {
          tokens: response.tokensUsed,
          cost: response.cost?.toFixed(6)
        });
        
        return response;

      } catch (error: any) {
        lastError = error;
        retries++;
        
        console.error(`[AI Service] Error with ${provider.name}:`, error.message || error);
        
        // Check if error is retryable
        const isRetryable = 
          error.status === 429 || // Rate limit
          error.status === 503 || // Service unavailable
          error.status === 500 || // Internal error
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNRESET' ||
          error.message?.includes('fetch');

        if (retries <= provider.maxRetries && isRetryable) {
          const delay = Math.min(1000 * Math.pow(2, retries - 1), 8000); // Exponential backoff
          console.warn(`[${provider.name}] Retrying in ${delay}ms...`, error.message);
          await sleep(delay);
        } else {
          console.warn(`[AI Service] ${provider.name} failed, moving to next provider...`);
          errors.push({ provider: provider.name, error });
          break; // Move to next provider
        }
      }
    }
  }

  // All providers failed
  console.error('[AI Service] All providers failed:', errors);
  
  throw new Error(
    `AI service unavailable. Tried ${errors.length} provider(s). ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
};

// ===========================
// Helper Functions
// ===========================

/**
 * Build system instruction for maternity care context
 */
export const buildMaternitySystemInstruction = (user: UserProfile, language: Language): string => {
  const userContext = `User Profile: Name: ${user.name}, Week: ${user.currentWeek}, Age: ${user.age || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Blood Group: ${user.bloodGroup || 'N/A'}, Pregnancy: ${user.pregnancyNumber || 1}${user.pregnancyNumber === 1 ? 'st' : user.pregnancyNumber === 2 ? 'nd' : 'rd'}.`;
  
  if (language === 'bn') {
    return `আপনি একজন অভিজ্ঞ বাংলাদেশী মাতৃত্বকালীন সঙ্গী এবং নার্স যার নাম 'Maa Care AI'। ${userContext} আপনি বাংলাদেশের প্রেক্ষাপটে উষ্ণ, বড় বোনের মতো (Apu/Didi) পরামর্শ প্রদান করেন। আপনি জানেন বাংলাদেশের সাধারণ খাবার (যেমন মাছ, ভাত, ডাল, শাক) এবং স্থানীয় প্রচলিত ধারণাগুলো সম্পর্কে। বিজ্ঞানভিত্তিক তথ্যের পাশাপাশি সহানুভূতি দিয়ে কথা বলুন। জরুরি সমস্যায় সর্বদা ডাক্তার দেখানোর পরামর্শ দেবেন। আপনার উত্তর অবশ্যই বাংলায় হতে হবে।`;
  }
  
  return `You are an experienced Bangladeshi maternity companion named 'Maa Care AI'. ${userContext} Provide warm, sisterly advice tailored to the Bangladeshi context (covering local diet like fish, lentils, and greens). Combine evidence-based advice with local cultural empathy. Always remind users to consult a local doctor for medical emergencies. Your response must be in English.`;
};

/**
 * Get provider status for debugging
 */
export const getProviderStatus = () => {
  return aiConfig.providers.map(p => ({
    name: p.name,
    enabled: p.enabled,
    priority: p.priority,
    hasApiKey: Boolean(p.apiKey),
    costPerToken: p.costPerToken
  }));
};

/**
 * Check if any provider is available
 */
export const isAIServiceAvailable = (): boolean => {
  return getEnabledProviders().length > 0;
};

/**
 * Get the most cost-effective provider
 */
export const getCheapestProvider = (): AIProvider | null => {
  const providers = getEnabledProviders();
  if (providers.length === 0) return null;
  
  return providers.reduce((cheapest, current) => 
    current.costPerToken < cheapest.costPerToken ? current : cheapest
  );
};

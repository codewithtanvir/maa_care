
export enum View {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  VOICE = 'voice',
  TRACKER = 'tracker',
  PROFILE = 'profile',
  HOSPITAL_BAG = 'hospital_bag',
  KICK_COUNTER = 'kick_counter',
  FOOD_SAFETY = 'food_safety',
  SYMPTOM_CHECKER = 'symptom_checker',
  ONBOARDING = 'onboarding',
  APPOINTMENTS = 'appointments'
}

export type Language = 'en' | 'bn';

export interface UserProfile {
  id?: string;
  name: string;
  phoneNumber: string;
  pin: string;
  dueDate: string;
  currentWeek: number;
  language: Language;
  onboarded: boolean;
  age?: number;
  weight?: number;
  pregnancyNumber?: number;
  appointments?: Appointment[];
  kick_history?: any[];
  hospital_bag?: any[];
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
}

export interface LogEntry {
  id: string;
  date: string;
  weight?: number;
  mood: 'happy' | 'tired' | 'anxious' | 'excited' | 'nauseous';
  symptoms: string[];
  notes: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
}

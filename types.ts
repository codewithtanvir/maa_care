
export enum View {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  VOICE = 'voice',
  TRACKER = 'tracker',
  PROFILE = 'profile',
  KICK_COUNTER = 'kick_counter',
  FOOD_SAFETY = 'food_safety',
  SYMPTOM_CHECKER = 'symptom_checker',
  ONBOARDING = 'onboarding',
  APPOINTMENTS = 'appointments',
  MOOD_TRACKER = 'mood_tracker',
  NOTIFICATIONS = 'notifications',
  NUTRITION = 'nutrition',
  EMERGENCY = 'emergency',
  CONTRACTION = 'contraction'
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
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarSeed?: string;
  appointments?: Appointment[];
  kick_history?: any[];
  notifications?: Notification[];
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  scheduled_for?: string;
  created_at: string;
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
  bloodPressure?: string;
  glucose?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
}

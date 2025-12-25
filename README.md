# Maa Care - Your AI Pregnancy Companion 🤰

<div align="center">
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-2.89.0-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_AI-1.34.0-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" />
</div>

<br />

Maa Care is a modern, AI-powered Progressive Web App (PWA) designed to support expectant mothers through their pregnancy journey. Built with a focus on the Bangladeshi context, it provides personalized medical insights, emotional support, and practical tools in both **English** and **Bengali** languages.

## 📋 Table of Contents

- [Features](#-features)
- [Hackathon Documentation](#-hackathon-documentation)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Database Setup](#-database-setup)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🤖 **AI-Powered Assistance**
- **Maa Care AI Chat**: Conversational AI companion powered by Google Gemini 2.0 Flash with multimodal support (text + image analysis)
- **Voice Support**: Real-time voice conversations with Gemini Multimodal Live API
- **Personalized Health Insights**: AI-generated wellness tips based on health logs and pregnancy week

### 📊 **Comprehensive Tracking**
- **Smart Dashboard**: Real-time pregnancy progress with week-by-week baby development (localized fruit-size comparisons)
- **Health Tracker**: Log mood, symptoms, weight, blood pressure, and glucose levels
- **Mood Tracker**: Daily mood popup with visual mood selection and symptom logging
- **Kick Counter**: Track baby movements with date/time stamps
- **Appointments**: Manage prenatal checkups and doctor visits

### 🍎 **Health & Safety**
- **Symptom Checker**: Analyze pregnancy symptoms with structured medical guidance and "Red Flag" warnings
- **Food Safety Guide**: Search 100+ foods/medications for safety during pregnancy
- **Nutrition Guide**: Trimester-specific nutrition advice and meal planning
- **Emergency Contacts**: Quick access to emergency numbers and red flag symptom alerts

### 🎒 **Delivery Preparation**
- **Hospital Bag Checklist**: Comprehensive packing list for delivery day
- **Custom Reminders**: Set appointment and medication reminders with specific times

### 🌍 **Accessibility**
- **Multi-language Support**: Fully localized in English (en) and Bengali (bn)
- **Offline Support**: PWA with service worker caching for offline access
- **Mobile-First**: Responsive design optimized for mobile devices
- **Installable**: Add to home screen functionality for native app experience

## 🏆 Hackathon Documentation

For detailed hackathon submission materials, including problem statements, user journeys, and prompt engineering documentation, please see:

👉 **[HACKATHON.md](HACKATHON.md)**

## 🚀 Tech Stack

### **Frontend**
- **React 19.2.3** - Modern UI library with concurrent features
- **TypeScript 5.8.2** - Type-safe development
- **Vite 6.4.1** - Fast build tool and dev server
- **Lucide React 0.562.0** - Beautiful icon library
- **Tailwind CSS** (via inline styles) - Utility-first styling

### **Backend & Database**
- **Supabase 2.89.0** - PostgreSQL database with real-time subscriptions
  - Authentication (PIN-based)
  - Row Level Security (RLS) policies
  - Auto-generated UUIDs for primary keys

### **AI & ML**
- **Multi-Provider AI System** with automatic fallback
  - **Google Gemini AI 1.34.0** (Primary)
    - Gemini 1.5 Flash - Health insights and chat responses
    - Gemini 2.0 Flash Exp - Multimodal Live API for voice support
    - Vision API - Image analysis for symptom checking
  - **OpenAI** (Secondary) - GPT-4o-mini for high-quality responses
  - **Groq** (Tertiary) - Ultra-fast inference with Llama 3.3 70B
  - **Anthropic Claude** (Optional) - Claude Haiku for complex queries
  - **OpenRouter** (Fallback) - Aggregator for multiple models
- **Intelligent Fallback System**
  - Automatic provider switching on failure
  - Retry logic with exponential backoff
  - Cost optimization by provider selection
  - 99%+ uptime guarantee

### **PWA & Offline**
- **Vite Plugin PWA 1.2.0** - Service worker generation
- **Workbox** - Precaching and runtime caching strategies
- **LocalStorage** - Client-side user state persistence

### **Other Dependencies**
- `@types/node` - Node.js type definitions
- `openai` - OpenAI SDK (optional integration)

## 🏗️ Architecture

### **Project Structure**
```
maternityai---pregnancy-companion/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard with pregnancy stats
│   ├── ChatSupport.tsx  # AI chat interface
│   ├── VoiceSupport.tsx # Voice assistant with live API
│   ├── HealthTracker.tsx # Health logging and insights
│   ├── MoodTracker.tsx  # Mood tracking component
│   ├── Appointments.tsx # Appointment management
│   ├── SymptomChecker.tsx # Symptom analysis
│   ├── FoodSafety.tsx   # Food/medication safety checker
│   ├── NutritionGuide.tsx # Trimester nutrition advice
│   ├── EmergencyContacts.tsx # Emergency info
│   ├── HospitalBag.tsx  # Delivery checklist
│   ├── KickCounter.tsx  # Fetal movement tracker
│   ├── ProfileSettings.tsx # User profile management
│   ├── Onboarding.tsx   # Registration/login flow
│   └── Notifications.tsx # Reminder management
├── services/            # External service integrations
│   ├── supabaseClient.ts # Supabase client configuration
│   ├── aiService.ts     # 🆕 Unified multi-provider AI service
│   └── geminiService.ts  # AI service functions (now uses aiService)
├── public/              # Static assets
├── dev-dist/            # PWA service worker files
├── App.tsx              # Main app component & routing
├── index.tsx            # React entry point
├── types.ts             # TypeScript type definitions
├── translations.ts      # i18n translations (en, bn)
├── vite.config.ts       # Vite configuration
├── .env.example         # 🆕 Example environment variables with all providers
└── package.json         # Dependencies and scripts
```

### **Database Schema**

#### **Tables**
1. **profiles** - User profiles
   - `id` (uuid, PK) - Auto-generated
   - `phone_number` (text, unique) - Login identifier
   - `pin` (text) - Authentication PIN
   - `name`, `due_date`, `current_week`, `language`
   - `age`, `weight`, `blood_group`, `pregnancy_number`
   - `emergency_contact_name`, `emergency_contact_phone`

2. **health_logs** - Daily health entries
   - `id` (uuid, PK), `user_id` (uuid, FK → profiles)
   - `date`, `mood`, `symptoms`, `notes`
   - `weight`, `blood_pressure`, `glucose`

3. **appointments** - Doctor appointments
   - `id` (uuid, PK), `user_id` (uuid, FK → profiles)
   - `title`, `date`, `time`, `location`

4. **notifications** - Custom reminders
   - `id` (uuid, PK), `user_id` (uuid, FK → profiles)
   - `message`, `scheduled_time`, `is_read`

5. **chat_messages** - AI conversation history
   - `id` (uuid, PK), `user_id` (uuid, FK → profiles)
   - `role` (user | assistant), `content`, `image_url`, `timestamp`

6. **medications** - Medication reminders
   - `id` (uuid, PK), `user_id` (uuid, FK → profiles)
   - `name`, `dosage`, `frequency`, `time`, `notes`

### **Data Flow**
1. **User Authentication**: PIN-based login → localStorage persistence → DB validation on app load
2. **Health Logging**: Component → Supabase insert → AI analysis → Display insights
3. **AI Chat**: User input → Multi-provider AI service (with automatic fallback) → Response streaming → DB storage
4. **Offline Mode**: Service worker intercepts requests → Cache-first strategy → Fallback to network

### **AI Service Architecture**

The app uses a sophisticated multi-provider AI system with automatic failover:

```
User Request
     ↓
AI Service Layer (aiService.ts)
     ↓
Priority-based Provider Selection:
     ├─→ 1. Gemini (Primary - Fast, Cost-effective)
     ├─→ 2. Groq (Secondary - Ultra-fast, Free tier)
     ├─→ 3. OpenAI (Tertiary - High quality)
     ├─→ 4. Anthropic (Quaternary - Very high quality)
     └─→ 5. OpenRouter (Final fallback - Aggregator)
     ↓
Retry Logic (2 retries per provider with exponential backoff)
     ↓
Response with provider name, token count, and cost
```

**Key Features:**
- **Automatic Fallback**: If Gemini fails, automatically tries Groq, then OpenAI, etc.
- **Retry Logic**: Each provider gets 2 retries with exponential backoff
- **Health Monitoring**: Tracks provider availability and performance
- **Cost Optimization**: Routes to cheaper providers first
- **Timeout Handling**: 30s timeout per request (10s for Groq)
- **Rate Limit Handling**: Automatically switches providers on 429 errors

## 🛠️ Getting Started

### **Prerequisites**
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher (or yarn/pnpm)
- **Supabase Account** ([supabase.com](https://supabase.com))
- **At least ONE AI Provider API Key**:
  - **Google AI Studio** ([ai.google.dev](https://ai.google.dev)) - Recommended, has free tier
  - **OR** OpenAI ([platform.openai.com](https://platform.openai.com))
  - **OR** Groq ([console.groq.com](https://console.groq.com)) - Free tier available
  - **OR** Any combination of the above for maximum reliability

### **Installation**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/maternityai---pregnancy-companion.git
   cd maternityai---pregnancy-companion
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   
   Create a `.env` file in the root directory. You need **at least one AI provider** API key:
   
   ```env
   # Supabase (Required)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Providers (At least one required, multiple recommended for reliability)
   VITE_GEMINI_API_KEY=your_gemini_api_key              # Recommended (free tier)
   VITE_OPENAI_API_KEY=your_openai_api_key              # Optional
   VITE_GROQ_API_KEY=your_groq_api_key                  # Optional (fast, free tier)
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key        # Optional
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key      # Optional (fallback)
   ```

   **Getting API Keys:**
   - **Gemini** (Recommended): [https://ai.google.dev/](https://ai.google.dev/) - Free tier with 15 RPM
   - **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) - Paid
   - **Groq**: [https://console.groq.com/](https://console.groq.com/) - Free tier with 30 RPM
   - **Anthropic**: [https://console.anthropic.com/](https://console.anthropic.com/) - Paid
   - **OpenRouter**: [https://openrouter.ai/keys](https://openrouter.ai/keys) - Some free models

   **Provider Priority:**
   The app automatically uses providers in this order:
   1. Gemini (fast, cost-effective)
   2. Groq (very fast, free tier)
   3. OpenAI (high quality)
   4. Anthropic (very high quality)
   5. OpenRouter (fallback aggregator)

   If one fails, it automatically tries the next one. Configure multiple providers for 99%+ uptime!

4. **Run development server**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

5. **Build for production**:
   ```bash
   npm run build
   ```
   
   Output: `dist/` directory

6. **Preview production build**:
   ```bash
   npm run preview
   ```

## 🗄️ Database Setup

### **1. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the Project URL and Anon Key to your `.env` file

### **2. Run Database Migrations**

Execute these SQL commands in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  current_week INTEGER NOT NULL,
  language TEXT DEFAULT 'en',
  onboarded BOOLEAN DEFAULT true,
  age INTEGER,
  weight DECIMAL,
  blood_group TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  pregnancy_number INTEGER DEFAULT 1,
  avatar_seed TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_logs table
CREATE TABLE health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT,
  symptoms TEXT,
  notes TEXT,
  weight DECIMAL,
  blood_pressure TEXT,
  glucose DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medications table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  time TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (permissive for development)
CREATE POLICY "Enable access for all users" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON health_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON medications FOR ALL USING (true) WITH CHECK (true);
```

### **3. Configure RLS (Production)**

For production, replace permissive policies with user-specific policies:

```sql
-- Example: Restrict profiles to authenticated users
DROP POLICY "Enable access for all users" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = current_user_id());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = current_user_id());
```

## 📱 PWA Installation

Maa Care is optimized for mobile devices and can be installed as a standalone app:

- **Android (Chrome)**: 
  1. Open the app in Chrome
  2. Tap the "Install App" button or menu → "Add to Home Screen"
  3. Confirm installation
  
- **iOS (Safari)**: 
  1. Open the app in Safari
  2. Tap the Share icon
  3. Select "Add to Home Screen"
  4. Confirm

- **Desktop (Chrome/Edge)**:
  1. Click the install icon in the address bar
  2. Or use the browser menu → "Install Maa Care"

## 🚢 Deployment

### **Option 1: Vercel (Recommended)**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Add Environment Variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY` (and/or other AI provider keys)
   - `VITE_OPENAI_API_KEY` (optional)
   - `VITE_GROQ_API_KEY` (optional)
   - `VITE_ANTHROPIC_API_KEY` (optional)
   - `VITE_OPENROUTER_API_KEY` (optional)

### **Option 2: Netlify**

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### **Option 3: Docker**

See [Dockerfile](Dockerfile) for containerized deployment.

```bash
docker build -t maa-care .
docker run -p 80:80 maa-care
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain bilingual support (English + Bengali)
- Test on mobile devices before submitting
- Update translations when adding new features
- Document complex functions with JSDoc comments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful multimodal AI capabilities
- **Supabase** for backend infrastructure
- **Lucide Icons** for beautiful iconography
- **React Community** for excellent tooling and support

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

<div align="center">
  Made with ❤️ for expectant mothers everywhere
</div>




# Maa Care - Your AI Pregnancy Companion

Maa Care is a modern, AI-powered Progressive Web App (PWA) designed to support expectant mothers through their pregnancy journey. Built with a focus on the Bangladeshi context, it provides personalized medical insights, emotional support, and practical tools.

## ✨ Key Features

- **Maa Care AI**: A warm, sisterly AI companion (powered by Gemini 2.0 Flash) for real-time chat and voice support.
- **Smart Dashboard**: Personalized daily insights, pregnancy progress tracking, and localized fruit-size references.
- **Symptom Checker**: Analyze pregnancy symptoms with structured medical guidance and "Red Flag" warnings.
- **Health Tracker**: Log mood, symptoms, and weight to receive personalized wellness tips.
- **Food Safety**: Instant guidance on safe foods and medications during pregnancy.
- **Hospital Bag & Kick Counter**: Essential tools to prepare for delivery and monitor baby's health.
- **Multi-language Support**: Fully localized in both **English** and **Bengali**.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Supabase (Auth, Database, RLS).
- **AI**: Google Gemini 1.5 Flash (Insights) & Gemini 2.0 Flash Exp (Multimodal Live API).
- **PWA**: Vite PWA Plugin for offline support and mobile installation.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A Supabase project
- A Google AI Studio API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/codewithtanvir/maa_care.git
   cd maa_care
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📱 PWA Installation

Maa Care is optimized for mobile devices. You can install it as a standalone app:
- **Android**: Tap the "Install App" button on the onboarding screen or use Chrome's "Add to Home Screen".
- **iOS**: Tap the Share icon in Safari and select "Add to Home Screen".

## 📄 License

This project is licensed under the MIT License.



import React, { useState, useEffect } from 'react';
import { View, UserProfile } from './types';
import Dashboard from './components/Dashboard';
import ChatSupport from './components/ChatSupport';
import VoiceSupport from './components/VoiceSupport';
import HealthTracker from './components/HealthTracker';
import ProfileSettings from './components/ProfileSettings';
import KickCounter from './components/KickCounter';
import Onboarding from './components/Onboarding';
import SymptomChecker from './components/SymptomChecker';
import Appointments from './components/Appointments';
import MoodTracker from './components/MoodTracker';
import Notifications from './components/Notifications';
import NutritionCare from './components/NutritionCare';
import EmergencyContacts from './components/EmergencyContacts';
import ContractionTimer from './components/ContractionTimer';
import { Home, MessageCircle, Activity, Calendar, X, Stethoscope } from 'lucide-react';
import { translations } from './translations';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Only show if not dismissed in this session
      const isDismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: Already in standalone mode');
      return;
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: If the event doesn't fire within 5 seconds, 
    // it might be because the browser doesn't support it or criteria aren't met.
    const timer = setTimeout(() => {
      if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA: beforeinstallprompt not fired after 5s');
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('maternity_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user", e);
        localStorage.removeItem('maternity_user');
      }
    }
  }, []);

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem('maternity_user', JSON.stringify(user));
    }
  }, [user, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('maternity_user');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView(View.DASHBOARD);
  };

  if (!user || !isAuthenticated) {
    return (
      <div className="flex justify-center bg-gray-100 h-[100dvh]">
        <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-hidden flex flex-col border-x border-gray-200">
           <Onboarding 
             onFinish={(profile) => {
               setUser(profile);
               setIsAuthenticated(true);
             }} 
             onInstall={handleInstallClick}
             canInstall={!!deferredPrompt}
           />
        </div>
      </div>
    );
  }

  const t = translations[user?.language || 'en'] || translations.en;

  const renderView = () => {
    if (!user) return <Dashboard user={{} as UserProfile} onNavigate={setCurrentView} />;
    
    switch (currentView) {
      case View.DASHBOARD: 
        return <Dashboard user={user} onNavigate={setCurrentView} />;
      case View.CHAT: 
        return <ChatSupport user={user} onBack={() => setCurrentView(View.DASHBOARD)} onNavigate={setCurrentView} />;
      case View.VOICE: 
        return <VoiceSupport user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.TRACKER: 
        return <HealthTracker user={user} onNavigate={setCurrentView} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.PROFILE: 
        return (
          <ProfileSettings 
            user={user} 
            onUpdate={setUser} 
            onLogout={handleLogout} 
            onBack={() => setCurrentView(View.DASHBOARD)} 
            onInstall={handleInstallClick}
            canInstall={!!deferredPrompt}
          />
        );
      case View.KICK_COUNTER: 
        return <KickCounter user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.FOOD_SAFETY:
      case View.NUTRITION:
        return <NutritionCare user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.SYMPTOM_CHECKER: 
        return <SymptomChecker user={user} onBack={() => setCurrentView(View.DASHBOARD)} onNavigate={setCurrentView} />;
      case View.APPOINTMENTS:
        return <Appointments user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.MOOD_TRACKER:
        return <MoodTracker user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.NOTIFICATIONS:
        return <Notifications user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.CONTRACTION:
        return <ContractionTimer user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.EMERGENCY:
        return <EmergencyContacts user={user} onBack={() => setCurrentView(View.DASHBOARD)} />;
      default: 
        return <Dashboard user={user} onNavigate={setCurrentView} />;
    }
  };

  const navItems = [
    { view: View.DASHBOARD, icon: Home, label: t.home },
    { view: View.TRACKER, icon: Activity, label: t.tracker },
    { view: View.CHAT, icon: MessageCircle, label: t.chat },
    { view: View.APPOINTMENTS, icon: Calendar, label: t.appointments },
    { view: View.SYMPTOM_CHECKER, icon: Stethoscope, label: t.symptoms }
  ];

  const isHomeGroup = [View.DASHBOARD, View.KICK_COUNTER, View.FOOD_SAFETY, View.SYMPTOM_CHECKER].includes(currentView);
  const hasInternalScroll = [View.CHAT, View.VOICE, View.PROFILE, View.APPOINTMENTS].includes(currentView);

  return (
    <div className="flex justify-center bg-gray-100 h-[100dvh] overflow-hidden">
      <div className="relative w-full max-w-md bg-slate-50 h-[100dvh] shadow-2xl flex flex-col border-x border-gray-200 safe-area-top overflow-hidden">
        {showInstallBanner && (
          <div className="absolute top-4 left-4 right-4 z-[100] bg-white rounded-2xl shadow-xl border border-pink-100 p-4 flex items-center gap-4 animate-in slide-in-from-top duration-500">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 border border-pink-50">
              <img src="/mask-icon.svg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{t.installApp}</p>
              <p className="text-xs text-gray-500 font-medium">{t.installDesc}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-pink-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-pink-100 active:scale-95 transition-all"
              >
                {t.installBtn}
              </button>
              <button 
                onClick={() => {
                  setShowInstallBanner(false);
                  sessionStorage.setItem('pwa_banner_dismissed', 'true');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        <main className={`flex-1 w-full ${hasInternalScroll ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {renderView()}
        </main>

        <nav className="w-full bg-white border-t border-slate-100 flex items-stretch justify-around px-2 pb-safe z-50">
          {navItems.map((item) => {
            const isActive = item.view === View.DASHBOARD ? isHomeGroup : currentView === item.view;
            
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className="flex flex-col items-center justify-center py-2 px-3 flex-1 transition-all duration-200"
              >
                <div className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-pink-500' 
                    : 'bg-transparent'
                }`}>
                  <item.icon 
                    size={22} 
                    strokeWidth={2} 
                    className={`transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                </div>
                <span className={`text-[11px] mt-1 transition-all duration-200 ${
                  isActive ? 'font-bold text-pink-600' : 'font-medium text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default App;

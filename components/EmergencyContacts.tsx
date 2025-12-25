
import React from 'react';
import { UserProfile } from '../types';
import { ArrowLeft, Phone, AlertCircle, MapPin, ShieldAlert, HeartPulse, Info } from 'lucide-react';
import { translations } from '../translations';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const EmergencyContacts: React.FC<Props> = ({ user, onBack }) => {
  const language = user.language || 'en';
  const t = translations[language] || translations.en;

  const emergencyNumbers = [
    { name: language === 'bn' ? 'জাতীয় জরুরি সেবা' : 'National Emergency', number: '999', icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
    { name: language === 'bn' ? 'অ্যাম্বুলেন্স (ঢাকা)' : 'Ambulance (Dhaka)', number: '10620', icon: HeartPulse, color: 'bg-orange-100 text-orange-600' },
    { name: language === 'bn' ? 'স্বাস্থ্য বাতায়ন' : 'Health Helpline', number: '16263', icon: Phone, color: 'bg-blue-100 text-blue-600' },
  ];

  const redFlags = language === 'bn' ? [
    'প্রবল রক্তপাত',
    'তীব্র পেটে ব্যথা',
    'মাথাব্যথা ও ঝাপসা দেখা',
    'শরীরে অতিরিক্ত পানি আসা বা ফোলা',
    'শিশুর নড়াচড়া কমে যাওয়া',
    'তীব্র জ্বর'
  ] : [
    'Heavy bleeding',
    'Severe abdominal pain',
    'Severe headache or blurred vision',
    'Sudden swelling of hands/face',
    'Decreased baby movement',
    'High fever'
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t.emergency}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Personal Emergency Contact */}
        {(user.emergencyContactName || user.emergencyContactPhone) && (
          <section className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-500" />
              {t.emergencyContacts}
            </h2>
            <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl">
              <div>
                <p className="font-bold text-red-900">{user.emergencyContactName || (language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact')}</p>
                <p className="text-red-700">{user.emergencyContactPhone}</p>
              </div>
              <a 
                href={`tel:${user.emergencyContactPhone}`}
                className="p-3 bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
              >
                <Phone className="w-6 h-6" />
              </a>
            </div>
          </section>
        )}

        {/* National Helplines */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            {language === 'bn' ? 'জাতীয় হেল্পলাইন' : 'National Helplines'}
          </h2>
          <div className="grid gap-3">
            {emergencyNumbers.map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.number}</p>
                  </div>
                </div>
                <a 
                  href={`tel:${item.number}`}
                  className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Red Flags / Risk Alerts */}
        <section className="bg-red-50 p-4 rounded-2xl border border-red-100">
          <h2 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {t.riskAlerts}
          </h2>
          <p className="text-sm text-red-700 mb-4">
            {language === 'bn' 
              ? 'নিচের যেকোনো লক্ষণ দেখা দিলে দেরি না করে অবিলম্বে ডাক্তারের সাথে যোগাযোগ করুন:'
              : 'If you experience any of the following, contact your doctor immediately:'}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {redFlags.map((flag, i) => (
              <div key={i} className="flex items-center gap-2 text-red-800 bg-white/50 p-2 rounded-lg">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span className="text-sm font-medium">{flag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Nearby Hospitals Info */}
        <section className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <h2 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t.nearbyHospitals}
          </h2>
          <p className="text-sm text-blue-700">
            {language === 'bn'
              ? 'আপনার নিকটস্থ সরকারি বা বেসরকারি হাসপাতালের জরুরি বিভাগের নম্বর সবসময় সাথে রাখুন।'
              : 'Always keep the emergency department number of your nearest public or private hospital with you.'}
          </p>
          <button 
            onClick={() => window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank')}
            className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
          >
            {language === 'bn' ? 'ম্যাপে হাসপাতাল খুঁজুন' : 'Find Hospitals on Map'}
          </button>
        </section>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-4 bg-gray-100 rounded-xl">
          <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            {t.medicalDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;

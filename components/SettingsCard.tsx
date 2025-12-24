
import React from 'react';

interface Props {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsCard: React.FC<Props> = ({ title, icon, children }) => {
  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-rose-100/50">
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="bg-rose-50 text-rose-500 p-2 rounded-xl">
          {icon}
        </div>
        <h3 className="text-base font-black text-gray-800 tracking-tight">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default SettingsCard;

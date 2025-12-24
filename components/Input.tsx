
import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label: string;
}

const Input: React.FC<Props> = ({ icon, label, ...props }) => {
  return (
    <div className="group">
      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block ml-1">{label}</label>
      <div className={`flex items-center bg-slate-50 rounded-xl px-3 py-2.5 border-2 border-transparent transition-all ${props.disabled ? 'opacity-60' : 'group-focus-within:border-rose-100 group-focus-within:bg-white'}`}>
        {icon && <div className={`mr-2 transition-colors ${props.disabled ? 'text-gray-300' : 'text-gray-500 group-focus-within:text-rose-500'}`}>{icon}</div>}
        <input 
          {...props}
          className="bg-transparent border-none p-0 w-full text-sm font-bold text-gray-800 focus:ring-0 placeholder:text-gray-300 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default Input;

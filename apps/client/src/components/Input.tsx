import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-textMain">{label}</label>}
      <input 
        className={`px-4 py-3 rounded-lg border border-border bg-surface text-textMain placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm ${className}`}
        {...props}
      />
    </div>
  );
}
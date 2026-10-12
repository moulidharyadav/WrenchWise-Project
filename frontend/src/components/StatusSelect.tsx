import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface StatusOption {
  value: string;
  label: string;
  color?: string; // Optional custom color indicator
}

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: StatusOption[];
  ariaLabel?: string;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  options,
  ariaLabel = 'Select Status',
  id,
  className = '',
  placeholder,
  disabled = false,
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none bg-[#091122] hover:bg-[#0c172e] border border-cyan-500/40 hover:border-cyan-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-lg px-3 py-2 pr-8 text-xs text-slate-100 font-medium outline-none transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {placeholder && (
          <option value="" className="bg-[#091122] text-slate-400">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-[#091122] text-slate-100 py-1"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

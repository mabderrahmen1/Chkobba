import React, { useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export function Input({
  label,
  value,
  onChange,
  className = '',
  icon,
  ...props
}: InputProps) {
  const inputId = useId();
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary ml-0.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent transition-colors" aria-hidden="true">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-surface-1 border border-border rounded-lg py-3
            ${icon ? 'pl-11' : 'pl-4'} pr-4
            text-text-primary placeholder:text-text-tertiary text-base
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50
            transition-all duration-150
            group-hover:border-text-tertiary
          `}
          {...props}
        />
      </div>
    </div>
  );
}

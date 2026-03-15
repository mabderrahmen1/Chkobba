interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && (
        <label className="text-[10px] sm:text-xs font-ancient uppercase tracking-[0.3em] text-brass-light/70 ml-1 font-bold">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brass/50 group-focus-within:text-brass transition-colors">
            {icon}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-black/60 border border-white/10 rounded-xl py-3.5 sm:py-4 
            ${icon ? 'pl-12' : 'pl-5'} pr-5
            text-cream placeholder:text-cream/20 font-body text-base
            focus:outline-none focus:border-brass/50 focus:bg-black/80
            transition-all duration-300 shadow-inner-dark
            group-hover:border-white/20
          `}
          {...props}
        />
        {/* Animated border bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brass-gradient group-focus-within:w-full transition-all duration-500 rounded-full" />
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'brass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
}: ButtonProps) {
  const variants = {
    primary: 'bg-accent text-white shadow-glow-red hover:bg-accent/90 border border-white/10',
    secondary: 'bg-gradient-to-b from-amber-800 to-amber-950 text-amber-100 border border-amber-700/50 hover:brightness-110 shadow-lg',
    success: 'bg-emerald-600 text-white shadow-glow-green hover:bg-emerald-500 border border-white/10',
    danger: 'bg-red-700 text-white shadow-glow-red hover:bg-red-600 border border-white/10',
    ghost: 'bg-transparent text-cream/60 hover:text-cream hover:bg-white/5 border border-white/5',
    brass: 'bg-gradient-to-b from-brass-light via-brass to-brass-dark text-black font-black shadow-glow-gold hover:brightness-110 border border-brass-light/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base tracking-widest',
    xl: 'px-10 py-5 text-lg tracking-[0.2em]',
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, translateY: -1 }}
      whileTap={disabled ? {} : { scale: 0.96, translateY: 0 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        rounded-xl font-ancient font-bold uppercase transition-all duration-300 
        disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale
        flex items-center justify-center relative overflow-hidden group
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {/* Subtle shine effect on hover */}
      {!disabled && (
        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shimmer transition-transform" />
      )}
      
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

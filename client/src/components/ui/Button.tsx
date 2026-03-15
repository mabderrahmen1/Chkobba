import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-gradient-to-b from-brass-light to-brass-dark text-black border border-brass-light shadow-[0_4px_15px_rgba(212,175,55,0.4)]',
  secondary: 'bg-surface-glass text-cream border border-brass/30 shadow-glass-panel backdrop-blur-md hover:bg-white/5',
  success: 'bg-gradient-to-b from-emerald-400 to-emerald-700 text-white border border-emerald-300 shadow-[0_4px_15px_rgba(16,185,129,0.4)]',
  danger: 'bg-gradient-to-b from-red-500 to-red-800 text-white border border-red-400 shadow-[0_4px_15px_rgba(239,68,68,0.4)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  onClick,
  type = 'button',
}: ButtonProps) {
  const sizeClasses = 
    size === 'sm' ? 'px-4 py-2 text-xs sm:text-sm' : 
    size === 'lg' ? 'px-8 py-4 text-lg sm:text-xl' : 
    'px-6 py-3 text-sm sm:text-base';

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03, y: -2, filter: 'brightness(1.1)' }}
      whileTap={disabled ? undefined : { scale: 0.95, y: 1, filter: 'brightness(0.9)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClasses[variant]} ${sizeClasses} font-ancient font-extrabold rounded-xl uppercase tracking-widest transition-colors shadow-button-inset disabled:opacity-50 disabled:grayscale-[50%] disabled:cursor-not-allowed cursor-pointer flex items-center justify-center relative overflow-hidden group ${className}`}
    >
      <span className="relative z-10 drop-shadow-md">{children}</span>
      {!disabled && variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      )}
    </motion.button>
  );
}

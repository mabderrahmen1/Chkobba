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
  primary: 'bg-black/90 text-brass-light border border-brass/50 hover:bg-black hover:border-brass shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] backdrop-blur-md',
  secondary: 'bg-black/60 text-cream/90 border border-white/10 hover:bg-black/80 hover:text-white hover:border-white/30 backdrop-blur-md shadow-lg',
  success: 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900 hover:border-emerald-400 shadow-lg',
  danger: 'bg-red-950/90 text-red-400 border border-red-500/50 hover:bg-red-900 hover:border-red-400 shadow-lg',
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
    size === 'lg' ? 'px-8 py-4 text-base sm:text-lg' : 
    'px-6 py-3 text-sm sm:text-base';

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClasses[variant]} ${sizeClasses} font-ancient font-bold rounded-xl uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center relative ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

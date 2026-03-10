import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-accent hover:bg-accent/90 text-cream border border-accent/50',
  secondary: 'bg-surface-card hover:bg-wood-light/30 text-cream border border-brass/20',
  success: 'bg-accent-success hover:bg-accent-success/90 text-white border border-accent-success/50',
  danger: 'bg-accent-danger/80 hover:bg-accent-danger text-cream border border-accent-danger/50',
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
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-6 py-3 text-base';

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClasses[variant]} ${sizeClasses} font-ancient font-semibold rounded-lg uppercase tracking-wide transition-all shadow-theme-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {children}
    </motion.button>
  );
}

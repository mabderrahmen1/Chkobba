interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-4 py-3 text-base bg-surface-card border border-brass/20 rounded-lg text-cream placeholder:text-foreground-muted focus:outline-none focus:border-brass/50 focus:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all font-body ${className}`}
      {...props}
    />
  );
}

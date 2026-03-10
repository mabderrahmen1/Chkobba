interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-4 py-3 text-base bg-surface-card border border-brass/20 rounded-lg text-cream focus:outline-none focus:border-brass/50 focus:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all font-body ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-5 py-4 text-lg bg-black/40 backdrop-blur-md border-2 border-brass/20 rounded-xl text-cream placeholder:text-cream/30 focus:outline-none focus:border-brass/70 focus:bg-black/60 focus:shadow-glow-gold transition-all duration-300 font-ancient tracking-widest ${className}`}
      {...props}
    />
  );
}

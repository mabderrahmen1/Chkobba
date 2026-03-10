interface BadgeProps {
  variant: 'host' | 'ready' | 'team0' | 'team1';
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  host: 'bg-accent-warning/80 text-cream',
  ready: 'bg-accent-success/80 text-cream',
  team0: 'bg-accent/80 text-cream',
  team1: 'bg-turquoise-dark/80 text-cream',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`${variantClasses[variant]} text-xs px-2 py-0.5 rounded font-ancient font-medium`}>
      {children}
    </span>
  );
}

import { motion } from 'framer-motion';

interface CapturedStackProps {
  count: number;
  label: string;
  variant: 'ally' | 'opponent';
}

export function CapturedStack({ count, label, variant }: CapturedStackProps) {
  const stackCards = Math.min(count, 8);
  const accentColor = variant === 'ally' ? 'rgba(64,224,208,0.5)' : 'rgba(192,57,43,0.4)';
  const borderClass = variant === 'ally' ? 'border-turquoise/30' : 'border-accent/30';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-1"
    >
      {/* Stack visual */}
      <div className="relative w-8 h-11 sm:w-10 sm:h-14">
        {count === 0 ? (
          <div className={`absolute inset-0 rounded border border-dashed ${borderClass} opacity-30`} />
        ) : (
          <>
            {Array.from({ length: stackCards }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded bg-wood-dark border border-brass/25"
                style={{
                  transform: `translateY(${-i * 1.2}px) rotate(${(i % 3 - 1) * 2}deg)`,
                  zIndex: i,
                  boxShadow: i === stackCards - 1
                    ? `0 2px 6px rgba(0,0,0,0.4), 0 0 8px ${accentColor}`
                    : '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                <div className="w-full h-full rounded opacity-15" style={{
                  backgroundImage: 'linear-gradient(45deg, #d4af37 25%, transparent 25%, transparent 50%, #d4af37 50%, #d4af37 75%, transparent 75%, transparent)',
                  backgroundSize: '3px 3px'
                }} />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Count badge */}
      <div className={`flex flex-col items-center`}>
        <span className="text-brass font-ancient font-bold text-xs md:text-sm leading-none">{count}</span>
        <span className="text-cream-dark/60 font-ancient text-[8px] md:text-[9px] uppercase tracking-wider">{label}</span>
      </div>
    </motion.div>
  );
}

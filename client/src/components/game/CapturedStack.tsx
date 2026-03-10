import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CapturedStackProps {
  count: number;
  label: string;
  variant: 'ally' | 'opponent';
}

export function CapturedStack({ count, label, variant }: CapturedStackProps) {
  const stackCards = Math.min(count, 8);
  const accentColor = variant === 'ally' ? 'rgba(64,224,208,0.5)' : 'rgba(192,57,43,0.4)';
  const borderClass = variant === 'ally' ? 'border-turquoise/30' : 'border-accent/30';
  const glowColor = variant === 'ally' ? 'rgba(64,224,208,0.6)' : 'rgba(192,57,43,0.5)';

  const prevCount = useRef(count);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (count > prevCount.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-1 relative"
    >
      {/* Flash on capture */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.8, 2.2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              width: 60,
              height: 60,
              left: '50%',
              top: '30%',
              marginLeft: -30,
              marginTop: -30,
            }}
          />
        )}
      </AnimatePresence>

      {/* Stack visual */}
      <div className="relative w-8 h-11 sm:w-10 sm:h-14">
        {count === 0 ? (
          <div className={`absolute inset-0 rounded border border-dashed ${borderClass} opacity-30`} />
        ) : (
          <>
            {Array.from({ length: stackCards }).map((_, i) => (
              <motion.div
                key={i}
                initial={i === stackCards - 1 && flash ? { scale: 0.7, y: -20 } : false}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Count badge */}
      <div className="flex flex-col items-center">
        <motion.span
          key={count}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="text-brass font-ancient font-bold text-xs md:text-sm leading-none"
        >
          {count}
        </motion.span>
        <span className="text-cream-dark/60 font-ancient text-[8px] md:text-[9px] uppercase tracking-wider">{label}</span>
      </div>
    </motion.div>
  );
}

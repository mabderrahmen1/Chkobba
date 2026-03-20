import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CapturedStackProps {
  count: number;
  label: string;
  variant: 'ally' | 'opponent';
}

export function CapturedStack({ count, label, variant }: CapturedStackProps) {
  const stackCards = Math.min(count, 8);
  const borderClass = variant === 'ally' ? 'border-accent/30' : 'border-danger/30';
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
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-1.5 relative">
      <div className="relative w-9 h-12 sm:w-11 sm:h-15">
        {count === 0 ? (
          <div className={`absolute inset-0 rounded border border-dashed ${borderClass} opacity-30`} />
        ) : (
          Array.from({ length: stackCards }).map((_, i) => (
            <motion.div key={i}
              initial={i === stackCards - 1 && flash ? { scale: 0.7, y: -20 } : false}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute inset-0 rounded bg-surface-3 border border-border"
              style={{ transform: `translateY(${-i * 1.2}px) rotate(${(i % 3 - 1) * 2}deg)`, zIndex: i }}
            />
          ))
        )}
      </div>
      <div className="flex flex-col items-center">
        <motion.span key={count} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
          className="text-text-primary font-semibold text-xs md:text-sm leading-none">{count}</motion.span>
        <span className="text-text-tertiary text-[10px] md:text-xs">{label}</span>
      </div>
    </motion.div>
  );
}

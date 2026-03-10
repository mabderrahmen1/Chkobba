import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState } from 'react';

function Diamond({ delay, x, y, size, opacity }: { delay: number; x: number; y: number; size: number; opacity: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: [0, opacity, opacity * 0.6, 0],
        scale: [0, 1, 0.8, 0],
        x,
        y,
        rotate: [0, 45, 90],
      }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        transform: 'rotate(45deg)',
        background: 'linear-gradient(135deg, #ff6b35, #e67e22, #f39c12)',
        boxShadow: `0 0 ${size}px rgba(230, 126, 34, 0.6)`,
      }}
    />
  );
}

function GlowRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        scale: [0.2, 1, 1.5],
      }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
        border: '2px solid rgba(230, 126, 34, 0.5)',
        boxShadow: '0 0 20px rgba(230, 126, 34, 0.3), inset 0 0 20px rgba(230, 126, 34, 0.1)',
      }}
    />
  );
}

export function HayyaEffect() {
  const hayyaPlayer = useGameStore((s) => s.hayyaPlayer);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (hayyaPlayer) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(t);
    }
  }, [hayyaPlayer]);

  const diamonds = Array.from({ length: 16 }, (_, i) => ({
    delay: Math.random() * 0.5,
    x: (Math.random() - 0.5) * 400,
    y: (Math.random() - 0.5) * 350,
    size: 6 + Math.random() * 14,
    opacity: 0.5 + Math.random() * 0.5,
  }));

  const rings = [
    { delay: 0, size: 80 },
    { delay: 0.2, size: 160 },
    { delay: 0.4, size: 260 },
  ];

  return (
    <AnimatePresence>
      {show && hayyaPlayer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Orange radial flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle, rgba(230,126,34,0.4) 0%, transparent 60%)' }}
          />

          {/* Expanding rings */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {rings.map((r, i) => (
              <GlowRing key={i} {...r} />
            ))}
            {diamonds.map((d, i) => (
              <Diamond key={i} {...d} />
            ))}
          </div>

          {/* Center diamond icon + text */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Large diamond symbol */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: 0, ease: 'easeInOut' }}
              className="text-5xl sm:text-7xl mb-2"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(230, 126, 34, 0.8))',
              }}
            >
              <span style={{ color: '#e67e22' }}>&#9830;</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-4xl font-ancient font-bold tracking-wider"
              style={{
                color: '#f39c12',
                textShadow: '0 0 20px rgba(230,126,34,0.7), 0 0 40px rgba(230,126,34,0.3), 0 3px 6px rgba(0,0,0,0.5)',
              }}
            >
              HAYYA!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xs sm:text-sm font-ancient mt-1"
              style={{ color: '#e67e22', textShadow: '0 0 8px rgba(230,126,34,0.4)' }}
            >
              7 of Diamonds captured by {hayyaPlayer}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState } from 'react';

function Diamond({ delay, x, y, size, opacity }: { delay: number; x: number; y: number; size: number; opacity: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: [0, opacity, opacity * 0.6, 0],
        scale: [0, 1.2, 0.8, 0],
        x,
        y,
        rotate: [0, 90, 180],
      }}
      transition={{ duration: 2.2, delay, ease: 'easeOut' }}
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        transform: 'rotate(45deg)',
        background: 'linear-gradient(135deg, #ff6b35, #e67e22, #f39c12)',
        boxShadow: `0 0 ${size * 2}px rgba(230, 126, 34, 0.8)`,
        zIndex: 10,
      }}
    />
  );
}

function WaveRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{
        opacity: [0, 0.7, 0],
        scale: [0.2, 1.5, 3],
      }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
        border: '3px solid rgba(255, 107, 53, 0.6)',
        boxShadow: '0 0 30px rgba(255, 107, 53, 0.4), inset 0 0 30px rgba(255, 107, 53, 0.2)',
      }}
    />
  );
}

export function HayyaEffect() {
  const hayyaPlayer = useGameStore((s) => s.hayyaPlayer);
  const [show, setShow] = useState(false);

  const hasHayya = !!hayyaPlayer;

  useEffect(() => {
    if (hasHayya) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [hasHayya]);

  const diamonds = Array.from({ length: 24 }, (_, i) => ({
    delay: Math.random() * 0.5,
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 500,
    size: 8 + Math.random() * 20,
    opacity: 0.6 + Math.random() * 0.4,
  }));

  const rings = [
    { delay: 0, size: 100 },
    { delay: 0.15, size: 200 },
    { delay: 0.3, size: 300 },
    { delay: 0.45, size: 450 },
  ];

  return (
    <AnimatePresence>
      {show && hasHayya && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Vibrant orange radial flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.5) 0%, transparent 70%)' }}
          />

          {/* Expanding rings */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {rings.map((r, i) => (
              <WaveRing key={i} {...r} />
            ))}
            {diamonds.map((d, i) => (
              <Diamond key={i} {...d} />
            ))}
          </div>

          {/* Center diamond icon + text */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: [0, 1.5, 1], y: [50, -10, 0] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Massive rotating diamond symbol */}
            <motion.div
              animate={{ 
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1],
                filter: [
                  'drop-shadow(0 0 20px rgba(230, 126, 34, 0.8))',
                  'drop-shadow(0 0 50px rgba(230, 126, 34, 1))',
                  'drop-shadow(0 0 20px rgba(230, 126, 34, 0.8))'
                ]
              }}
              transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
              className="text-7xl sm:text-9xl mb-4"
            >
              <span style={{ color: '#ff6b35' }}>&#9830;</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-6xl md:text-7xl font-ancient font-black tracking-[0.2em]"
              style={{
                color: '#f39c12',
                textShadow: '0 0 30px rgba(255,107,53,0.8), 0 0 60px rgba(255,107,53,0.4), 0 5px 10px rgba(0,0,0,0.6)',
              }}
            >
              HAYYA!
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-orange-950/60 backdrop-blur-md px-6 py-1.5 rounded-lg border border-orange-500/40 shadow-xl mt-4"
            >
              <span className="text-orange-400 font-ancient text-sm sm:text-base uppercase tracking-widest font-bold">
                7 of Diamonds by {hayyaPlayer}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

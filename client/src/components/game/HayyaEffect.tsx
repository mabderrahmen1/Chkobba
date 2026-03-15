import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState } from 'react';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';

function DiamondParticle({ delay, x, y, size, opacity }: { delay: number; x: number; y: number; size: number; opacity: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: [0, opacity, opacity * 0.6, 0],
        scale: [0, 1.5, 0.5, 0],
        x,
        y,
        rotate: [0, 180, 360],
      }}
      transition={{ duration: 3, delay, ease: [0.22, 1, 0.36, 1] }}
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        transform: 'rotate(45deg)',
        background: 'linear-gradient(135deg, #ff6b35, #e67e22, #f39c12)',
        boxShadow: `0 0 ${size * 3}px rgba(255, 107, 53, 0.9)`,
        zIndex: 10,
      }}
    />
  );
}

function WaveRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.1 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0.1, 2, 5],
      }}
      transition={{ duration: 2, delay, ease: 'easeOut' }}
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
        border: '4px solid rgba(255, 107, 53, 0.8)',
        boxShadow: '0 0 50px rgba(255, 107, 53, 0.5), inset 0 0 50px rgba(255, 107, 53, 0.3)',
      }}
    />
  );
}

export function HayyaEffect() {
  const hayyaPlayer = useGameStore((s) => s.hayyaPlayer);
  const [show, setShow] = useState(false);
  const { playHayyaSound } = useAmbianceSound();

  const hasHayya = !!hayyaPlayer;

  useEffect(() => {
    if (hasHayya) {
      playHayyaSound();
      
      // Slight delay to sync with sound intro
      const hypeTimeout = setTimeout(() => {
        setShow(true);
      }, 400);

      return () => clearTimeout(hypeTimeout);
    } else {
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [hasHayya, playHayyaSound]);

  const diamonds = Array.from({ length: 40 }, (_, i) => ({
    delay: Math.random() * 0.6,
    x: (Math.random() - 0.5) * 1000,
    y: (Math.random() - 0.5) * 800,
    size: 10 + Math.random() * 30,
    opacity: 0.7 + Math.random() * 0.3,
  }));

  const rings = [
    { delay: 0, size: 100 },
    { delay: 0.2, size: 250 },
    { delay: 0.4, size: 450 },
    { delay: 0.6, size: 700 },
  ];

  return (
    <AnimatePresence>
      {show && hasHayya && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
        >
          {/* Legendary Golden-Orange Glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.6) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }}
          />

          {/* Expanding rings & particles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {rings.map((r, i) => (
              <WaveRing key={i} {...r} />
            ))}
            {diamonds.map((d, i) => (
              <DiamondParticle key={i} {...d} />
            ))}
          </div>

          {/* Center Content */}
          <motion.div
            initial={{ scale: 0, y: 100, rotateY: 180 }}
            animate={{ scale: [0, 2, 1], y: [100, -20, 0], rotateY: [180, 0, 0] }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Massive rotating diamond symbol */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.3, 1],
                filter: [
                  'drop-shadow(0 0 30px rgba(255, 107, 53, 0.8))',
                  'drop-shadow(0 0 100px rgba(255, 107, 53, 1))',
                  'drop-shadow(0 0 30px rgba(255, 107, 53, 0.8))'
                ]
              }}
              transition={{ 
                rotate: { duration: 6, repeat: Infinity, ease: "linear" }, 
                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" } 
              }}
              className="text-8xl sm:text-[12rem] mb-6 select-none"
            >
              <span style={{ 
                color: '#ff6b35',
                background: 'linear-gradient(135deg, #fff 0%, #ff6b35 50%, #e67e22 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                &#9830;
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-5xl sm:text-8xl md:text-9xl font-ancient font-black tracking-[0.3em]"
              style={{
                color: '#f39c12',
                textShadow: '0 0 40px rgba(255,107,53,1), 0 0 80px rgba(255,107,53,0.5), 0 10px 20px rgba(0,0,0,0.8)',
              }}
            >
              HAYYA!
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-r from-orange-950/80 via-orange-900/90 to-orange-950/80 backdrop-blur-2xl px-12 py-3 rounded-2xl border-2 border-orange-500/50 shadow-[0_0_60px_rgba(255,107,53,0.4)] mt-10"
            >
              <span className="text-orange-400 font-ancient text-xl sm:text-3xl uppercase tracking-[0.4em] font-black italic">
                The Legendary {hayyaPlayer}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState } from 'react';

function Particle({ delay, x, y, size, color }: { delay: number; x: number; y: number; size: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.3],
        x: x,
        y: y,
      }}
      transition={{ duration: 1.6, delay, ease: 'easeOut' }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        left: '50%',
        top: '50%',
        filter: 'blur(1px)',
      }}
    />
  );
}

function Spark({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 0.8, 0],
        scale: [0.5, 1, 0.5],
        x: tx,
        y: ty,
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      className="absolute pointer-events-none"
      style={{
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: '#f9e596',
        left: '50%',
        top: '50%',
        boxShadow: '0 0 6px 2px rgba(212, 175, 55, 0.8)',
      }}
    />
  );
}

export function ChkobbaEffect() {
  const chkobbaPlayer = useGameStore((s) => s.chkobbaPlayer);
  const nickname = useGameStore((s) => s.nickname);
  const [show, setShow] = useState(false);

  // Only show if someone else made the Chkobba
  const isOpponentChkobba = chkobbaPlayer && chkobbaPlayer !== nickname;

  useEffect(() => {
    if (isOpponentChkobba) {
      setShow(true);
      // Trigger screen shake
      const el = document.getElementById('game-screen');
      if (el) {
        el.classList.add('chkobba-shake');
        const onEnd = () => el.classList.remove('chkobba-shake');
        el.addEventListener('animationend', onEnd, { once: true });
      }
    } else {
      // Faster hide
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpponentChkobba]);

  const particles = Array.from({ length: 24 }, (_, i) => ({
    delay: Math.random() * 0.3,
    x: (Math.random() - 0.5) * 500,
    y: (Math.random() - 0.5) * 400,
    size: 8 + Math.random() * 20,
    color: ['#d4af37', '#f9e596', '#e67e22', '#ff6b35', '#ffd700'][Math.floor(Math.random() * 5)],
  }));

  const sparks = Array.from({ length: 32 }, (_, i) => ({
    delay: Math.random() * 0.4,
    angle: (i * 360) / 32 + Math.random() * 15,
    distance: 100 + Math.random() * 200,
  }));

  return (
    <AnimatePresence>
      {show && isOpponentChkobba && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Screen flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)' }}
          />

          {/* Border glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.4, 0] }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 0 120px 40px rgba(212, 175, 55, 0.5)' }}
          />

          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {particles.map((p, i) => (
              <Particle key={i} {...p} />
            ))}
            {sparks.map((s, i) => (
              <Spark key={`s-${i}`} {...s} />
            ))}
          </div>

          {/* Main text */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: [0, 1.4, 1], rotate: [-15, 5, 0] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: 1, ease: 'easeInOut' }}
              className="text-4xl sm:text-6xl md:text-7xl font-ancient font-bold tracking-wider"
              style={{
                color: '#f9e596',
                textShadow: '0 0 30px rgba(212,175,55,0.8), 0 0 60px rgba(212,175,55,0.4), 0 4px 8px rgba(0,0,0,0.5)',
              }}
            >
              CHKOBBA!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm sm:text-lg font-ancient mt-2"
              style={{
                color: '#d4af37',
                textShadow: '0 0 10px rgba(212,175,55,0.5)',
              }}
            >
              by {chkobbaPlayer}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

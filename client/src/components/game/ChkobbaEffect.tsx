import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState } from 'react';

function Particle({ delay, x, y, size, color }: { delay: number; x: number; y: number; size: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1, 0.2],
        x: x,
        y: y,
      }}
      transition={{ duration: 2, delay, ease: 'easeOut' }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 80%)`,
        left: '50%',
        top: '50%',
        filter: 'blur(1px)',
        zIndex: 10,
      }}
    />
  );
}

function Shockwave({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, border: '4px solid #f9e596' }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 2.5, 4],
        borderWidth: ['10px', '2px', '0px'],
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 200,
        height: 200,
        left: '50%',
        top: '50%',
        marginLeft: -100,
        marginTop: -100,
        boxShadow: '0 0 40px #d4af37, inset 0 0 20px #d4af37',
      }}
    />
  );
}

export function ChkobbaEffect() {
  const chkobbaPlayer = useGameStore((s) => s.chkobbaPlayer);
  const [show, setShow] = useState(false);

  const hasChkobba = !!chkobbaPlayer;

  useEffect(() => {
    if (hasChkobba) {
      setShow(true);
      // Trigger screen shake
      const el = document.getElementById('game-screen');
      if (el) {
        el.classList.add('chkobba-shake');
        const onEnd = () => el.classList.remove('chkobba-shake');
        el.addEventListener('animationend', onEnd, { once: true });
      }
    } else {
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [hasChkobba]);

  const particles = Array.from({ length: 60 }, (_, i) => ({
    delay: Math.random() * 0.5,
    x: (Math.random() - 0.5) * 800,
    y: (Math.random() - 0.5) * 600,
    size: 4 + Math.random() * 30,
    color: ['#d4af37', '#f9e596', '#ffffff', '#ff6b35', '#ffd700', '#e67e22'][Math.floor(Math.random() * 6)],
  }));

  return (
    <AnimatePresence>
      {show && hasChkobba && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Intense Flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-brass/20 to-transparent"
          />

          {/* Shockwaves */}
          <Shockwave delay={0} />
          <Shockwave delay={0.2} />
          <Shockwave delay={0.4} />

          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {particles.map((p, i) => (
              <Particle key={i} {...p} />
            ))}
          </div>

          {/* Main text with dramatic entrance */}
          <motion.div
            initial={{ scale: 0, rotate: -25, y: 100 }}
            animate={{ 
              scale: [0, 1.8, 1], 
              rotate: [-25, 10, 0],
              y: [100, -20, 0]
            }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.div
              animate={{ 
                textShadow: [
                  '0 0 20px rgba(212,175,55,0.8), 0 0 40px rgba(212,175,55,0.4)',
                  '0 0 50px rgba(212,175,55,1), 0 0 100px rgba(212,175,55,0.6)',
                  '0 0 20px rgba(212,175,55,0.8), 0 0 40px rgba(212,175,55,0.4)'
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl sm:text-8xl md:text-9xl font-ancient font-black tracking-widest italic"
              style={{
                color: '#f9e596',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))',
              }}
            >
              CHKOBBA!
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="bg-black/60 backdrop-blur-md px-8 py-2 rounded-full border border-brass/40 shadow-2xl mt-4"
            >
              <span className="text-brass-light font-ancient text-xl sm:text-2xl uppercase tracking-[0.3em] font-bold">
                by {chkobbaPlayer}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

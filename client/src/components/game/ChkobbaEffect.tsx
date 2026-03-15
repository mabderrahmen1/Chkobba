import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState } from 'react';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';

function Particle({ delay, x, y, size, color }: { delay: number; x: number; y: number; size: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 2, 1, 0],
        x: x,
        y: y,
      }}
      transition={{ duration: 2.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 80%)`,
        left: '50%',
        top: '50%',
        filter: 'blur(2px)',
        zIndex: 10,
        boxShadow: `0 0 ${size}px ${color}`,
      }}
    />
  );
}

function Shockwave({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, border: '4px solid #f9e596' }}
      animate={{
        opacity: [0, 0.9, 0],
        scale: [0, 3, 6],
        borderWidth: ['20px', '2px', '0px'],
      }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 300,
        height: 300,
        left: '50%',
        top: '50%',
        marginLeft: -150,
        marginTop: -150,
        boxShadow: '0 0 60px #d4af37, inset 0 0 40px #d4af37',
      }}
    />
  );
}

export function ChkobbaEffect() {
  const chkobbaPlayer = useGameStore((s) => s.chkobbaPlayer);
  const [show, setShow] = useState(false);
  const { playChkobbaSound } = useAmbianceSound();

  const hasChkobba = !!chkobbaPlayer;

  useEffect(() => {
    if (hasChkobba) {
      playChkobbaSound();
      
      // Delay visual effect to let the sound build hype
      const hypeTimeout = setTimeout(() => {
        setShow(true);
        // Trigger intense screen shake
        const el = document.getElementById('game-screen');
        if (el) {
          el.classList.add('chkobba-shake-intense');
          const onEnd = () => el.classList.remove('chkobba-shake-intense');
          el.addEventListener('animationend', onEnd, { once: true });
        }
      }, 1200);

      return () => clearTimeout(hypeTimeout);
    } else {
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [hasChkobba, playChkobbaSound]);

  const particles = Array.from({ length: 100 }, (_, i) => ({
    delay: Math.random() * 0.4,
    x: (Math.random() - 0.5) * 1200,
    y: (Math.random() - 0.5) * 900,
    size: 4 + Math.random() * 50,
    color: ['#ff0000', '#d4af37', '#f9e596', '#ffffff', '#ff6b35', '#ffd700', '#e67e22'][Math.floor(Math.random() * 7)],
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
          {/* Intense Flash with color shift */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              backgroundColor: ['#ffffff', '#ffd700', '#ffffff']
            }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-brass/20 to-transparent"
          />

          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {particles.map((p, i) => (
              <Particle key={i} {...p} />
            ))}
          </div>

          {/* Shockwaves */}
          <Shockwave delay={0} />
          <Shockwave delay={0.15} />
          <Shockwave delay={0.3} />

          {/* Main text with dramatic entrance */}
          <motion.div
            initial={{ scale: 0, rotate: -45, y: 200, filter: 'blur(20px)' }}
            animate={{ 
              scale: [0, 2.5, 1], 
              rotate: [-45, 15, 0],
              y: [200, -50, 0],
              filter: 'blur(0px)'
            }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 20px rgba(212,175,55,0.8), 0 0 40px rgba(212,175,55,0.4)',
                  '0 0 80px rgba(212,175,55,1), 0 0 160px rgba(212,175,55,0.6)',
                  '0 0 20px rgba(212,175,55,0.8), 0 0 40px rgba(212,175,55,0.4)'
                ]
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-7xl sm:text-9xl md:text-[12rem] font-ancient font-black tracking-tighter italic"
              style={{
                color: '#f9e596',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.9))',
                background: 'linear-gradient(to bottom, #fdf1bc 0%, #d4af37 50%, #aa8033 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CHKOBBA!
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="bg-black/80 backdrop-blur-xl px-12 py-3 rounded-2xl border-2 border-brass/50 shadow-[0_0_50px_rgba(212,175,55,0.3)] mt-8"
            >
              <span className="text-brass-light font-ancient text-2xl sm:text-4xl uppercase tracking-[0.5em] font-black italic">
                {chkobbaPlayer} scores!
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

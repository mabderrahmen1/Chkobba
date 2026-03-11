import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmbianceSound } from '../../../hooks/useAmbianceSound';

export function Hookah() {
  const { playBubble } = useAmbianceSound();
  const [isBubbling, setIsBubbling] = useState(false);

  const handleInteract = () => {
    console.log("Hookah clicked");
    if (isBubbling) return;
    setIsBubbling(true);
    playBubble();
    setTimeout(() => setIsBubbling(false), 3000);
  };

  return (
    <div className="relative group pointer-events-none">
      {/* Dynamic Smoke Particles */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-1/2 h-1/3 pointer-events-none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="smoke-particle animate-float-up"
            style={{
              width: 40 + i * 20,
              height: 40 + i * 20,
              '--dur': `${5 + i * 1.2}s`,
              '--drift': `${(i % 2 === 0 ? 1 : -1) * 60}px`,
              animationDelay: `${i * 1}s`,
              left: '20%',
              opacity: 0.25
            } as any}
          />
        ))}
      </div>

      {/* Glowing Coal Effect */}
      <div className="absolute top-[18%] left-[48%] w-[8%] h-[4%] rounded-full bg-[#ff4500] blur-2xl opacity-90 animate-pulse pointer-events-none" />

      <motion.div
        className="relative cursor-pointer pointer-events-auto"
        style={{ width: 'clamp(110px, 16vw, 220px)', height: 'clamp(200px, 28vw, 400px)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInteract}
        animate={isBubbling ? {
          scale: [1, 1.05, 1],
          rotate: [0, -1, 1, -1, 0]
        } : {}}
        transition={{ duration: 0.4, repeat: isBubbling ? 7 : 0 }}
      >
        <img
          src="/pics/b58a51d072acc13ff8c69f712b9fe224-removebg.png"
          alt="Chicha"
          className="w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.7)]"
        />
      </motion.div>

      {/* Smoke Screen Burst on click */}
      <AnimatePresence>
        {isBubbling && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`smoke-burst-${i}`}
                initial={{
                  opacity: 0.7,
                  scale: 0.3,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: 1.5 + Math.random() * 2,
                  x: (Math.random() - 0.5) * 300,
                  y: -80 - Math.random() * 250,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random() * 1.5,
                  delay: i * 0.15,
                  ease: 'easeOut',
                }}
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: 40 + Math.random() * 60,
                  height: 40 + Math.random() * 60,
                  bottom: '50%',
                  left: '40%',
                  background: 'radial-gradient(circle, rgba(180,180,180,0.5) 0%, rgba(120,120,120,0.2) 40%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

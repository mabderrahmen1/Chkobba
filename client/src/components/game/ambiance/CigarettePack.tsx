import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmbianceSound } from '../../../hooks/useAmbianceSound';

export function CigarettePack() {
  const { playLighter } = useAmbianceSound();
  const [isLit, setIsLit] = useState(false);

  const handleInteract = () => {
    console.log("Cigarettes clicked");
    if (isLit) return;
    setIsLit(true);
    playLighter();
    setTimeout(() => setIsLit(false), 5000);
  };

  return (
    <div className="relative group pointer-events-none">
      {/* Dynamic Smoke from burning cigarette tip */}
      <div className="absolute top-[-25%] right-[10%] w-1/3 h-1/3 pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="smoke-particle animate-float-up"
            style={{
              width: 25 + i * 12,
              height: 25 + i * 12,
              '--dur': `${3 + i * 0.7}s`,
              '--drift': `${30 + i * 15}px`,
              animationDelay: `${i * 1.2}s`,
              opacity: 0.35
            } as any}
          />
        ))}
      </div>

      <motion.div
        className="relative flex flex-col items-center cursor-pointer pointer-events-auto"
        style={{ width: 'clamp(60px, 10vw, 160px)', height: 'clamp(60px, 10vw, 160px)' }}
        whileHover={{ scale: 1.05, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInteract}
      >
        <img
          src="/pics/5.png"
          alt="Camel Cigarettes"
          className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.7)]"
        />

        {isLit && (
          <motion.div
            className="absolute top-[22%] right-[12%] w-6 h-6 rounded-full bg-[#ff4500]"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ filter: "blur(6px)", boxShadow: "0 0 25px #ff6a00" }}
          />
        )}
      </motion.div>

      {/* Smoke Screen Burst on click */}
      <AnimatePresence>
        {isLit && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`cig-smoke-${i}`}
                initial={{
                  opacity: 0.6,
                  scale: 0.2,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: 1 + Math.random() * 1.5,
                  x: (Math.random() - 0.3) * 200,
                  y: -50 - Math.random() * 180,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: 25 + Math.random() * 40,
                  height: 25 + Math.random() * 40,
                  top: '20%',
                  right: '10%',
                  background: 'radial-gradient(circle, rgba(200,200,200,0.45) 0%, rgba(150,150,150,0.15) 40%, transparent 70%)',
                  filter: 'blur(6px)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

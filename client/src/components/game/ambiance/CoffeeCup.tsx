import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAmbianceSound } from '../../../hooks/useAmbianceSound';

export function CoffeeCup() {
  const [isDrinking, setIsDrinking] = useState(false);
  const { playClink } = useAmbianceSound();

  const handleDrink = () => {
    if (isDrinking) return;
    setIsDrinking(true);
    playClink();

    setTimeout(() => {
      setIsDrinking(false);
    }, 3000);
  };

  return (
    <div className="relative group pointer-events-none">
      {/* Dynamic Steam Particles */}
      {!isDrinking && (
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-1/2 h-1/3 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="smoke-particle animate-float-up"
              style={{
                width: 35 + i * 15,
                height: 35 + i * 15,
                '--dur': `${3 + i * 0.8}s`,
                '--drift': `${(i - 1) * 45}px`,
                animationDelay: `${i * 1.1}s`,
                left: '10%'
              } as any}
            />
          ))}
        </div>
      )}

      <motion.div
        className="relative cursor-pointer pointer-events-auto"
        style={{ width: 'clamp(80px, 14vw, 200px)', height: 'clamp(80px, 14vw, 200px)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleDrink}
        animate={isDrinking ? {
          y: [-30, -150, -30],
          rotate: [0, -45, 0],
          scale: [1, 1.25, 1]
        } : {}}
        transition={{ duration: 1.5, ease: "anticipate" }}
      >
        <img
          src="/pics/arabic-coffee_7991 1.png"
          alt="Arabic Coffee"
          className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
        />
      </motion.div>
    </div>
  );
}

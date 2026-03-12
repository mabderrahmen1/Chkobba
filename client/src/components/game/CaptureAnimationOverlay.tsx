import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { Card } from './Card';
import { useEffect, useState } from 'react';

export function CaptureAnimationOverlay() {
  const lastAction = useGameStore((s) => s.gameState?.lastAction);
  const [activeAction, setActiveAction] = useState<typeof lastAction>(null);

  useEffect(() => {
    if (lastAction && lastAction.type === 'capture') {
      setActiveAction(lastAction);
      const timer = setTimeout(() => setActiveAction(null), 2200); // Cinematic duration
      return () => clearTimeout(timer);
    }
  }, [lastAction?.timestamp]);

  if (!activeAction || activeAction.type !== 'capture') return null;

  const { card, capturedCards, playerId, isChkobba, isHayya } = activeAction;
  const isMe = playerId === useGameStore.getState().playerId;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Backdrop dim with subtle radial blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Action Title - Elegant & Large */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: -180, opacity: 1, scale: 1 }}
            className={`absolute font-ancient text-3xl sm:text-5xl uppercase tracking-[0.4em] font-bold drop-shadow-glow-gold ${
              isChkobba ? 'text-accent' : isHayya ? 'text-pink-400' : 'text-brass'
            }`}
          >
            {isChkobba ? 'CHKOBBA!' : isHayya ? '7 HAYA!' : 'CAPTURE'}
          </motion.div>

          <div className="relative flex items-center justify-center gap-6 sm:gap-16">
            {/* The Played Card - Enters with weight */}
            <motion.div
              initial={{ scale: 0.3, x: isMe ? 0 : -300, y: isMe ? 400 : -400, rotate: -20 }}
              animate={{ scale: 1.4, x: -100, y: 0, rotate: -5 }}
              transition={{ type: 'spring', damping: 18, stiffness: 80 }}
              className="z-20 relative"
            >
              <Card card={card} />
              <motion.div 
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-2 bg-accent/10 blur-xl rounded-full -z-10" 
              />
            </motion.div>

            {/* Collision Burst / Arrow */}
            <motion.div 
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1.5, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="text-brass/80 text-5xl font-bold"
            >
              ➝
            </motion.div>

            {/* The Captured Cards - Fan out elegantly */}
            <div className="flex -space-x-20 sm:-space-x-24">
              {capturedCards?.map((c, i) => (
                <motion.div
                  key={`${c.rank}-${c.suit}-${i}`}
                  initial={{ scale: 0.3, opacity: 0, x: 200, y: 50 }}
                  animate={{ 
                    scale: 1.3, 
                    opacity: 1, 
                    x: 0, 
                    y: 0,
                    rotate: (i - (capturedCards.length-1)/2) * 12 
                  }}
                  transition={{ delay: 0.5 + (i * 0.12), type: 'spring', damping: 14 }}
                  className="z-10 shadow-2xl"
                >
                  <Card card={c} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Collection Swish - Smooth, accelerated exit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="absolute inset-0 flex items-center justify-center"
          >
             <motion.div
               animate={{ 
                 scale: [1, 1.1, 0],
                 x: isMe ? -500 : 500,
                 y: isMe ? 600 : -600,
                 rotate: isMe ? -120 : 120,
                 opacity: [1, 1, 0]
               }}
               transition={{ delay: 1.7, duration: 0.8, ease: [0.45, 0, 0.55, 1] }}
               className="flex items-center justify-center"
             >
                <div className="relative scale-125">
                   <div className="shadow-glow-gold rounded-lg ring-2 ring-white/10">
                      <Card card={card} />
                   </div>
                   {capturedCards?.slice(0, 2).map((c, i) => (
                     <div key={i} className="absolute inset-0 -z-10" style={{ transform: `translate(${(i+1)*6}px, ${(i+1)*6}px) rotate(${(i+1)*5}deg)` }}>
                        <Card card={c} />
                     </div>
                   ))}
                </div>
             </motion.div>
          </motion.div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

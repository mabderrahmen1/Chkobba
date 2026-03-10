import { motion, AnimatePresence } from 'framer-motion';
import { useAmbianceSound } from '../../../hooks/useAmbianceSound';
import { useUIStore } from '../../../stores/useUIStore';
import { useEffect } from 'react';

export function Waitress() {
  const { playWaitressVoice } = useAmbianceSound();
  const status = useUIStore((s) => s.waitressStatus);
  const isVisible = useUIStore((s) => s.isWaitressVisible);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -200 }}
          animate={status === 'serving' ? {
            x: [0, 50, 0],
            scale: [1, 1.05, 1],
            opacity: 1
          } : { opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -200 }}
          className="relative pointer-events-none z-10 group"
          style={{ width: 'clamp(120px, 18vw, 320px)' }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Speech Bubble */}
          <AnimatePresence>
            {status === 'serving' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: -50 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute top-0 right-0 bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-[10px] sm:text-xs shadow-xl border-2 border-brass z-50 whitespace-nowrap pointer-events-none"
                style={{ fontFamily: 'sans-serif' }}
              >
                Hi sexy boy! 😉
                <div className="absolute bottom-[-10px] left-4 w-4 h-4 bg-white border-b-2 border-r-2 border-brass rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.img
            src="/pics/waitress.png"
            alt="Waitress"
            className="w-full h-auto drop-shadow-2xl object-contain pointer-events-auto cursor-pointer"
            style={{
              mixBlendMode: 'multiply',
              filter: "brightness(1.1) contrast(1.1)"
            }}
            whileHover={{ scale: 1.02 }}
            onClick={() => playWaitressVoice()}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 1, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

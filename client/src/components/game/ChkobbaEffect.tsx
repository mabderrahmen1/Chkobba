import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState } from 'react';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';

export function ChkobbaEffect() {
  const chkobbaPlayer = useGameStore((s) => s.chkobbaPlayer);
  const [show, setShow] = useState(false);
  const { playChkobbaSound } = useAmbianceSound();

  const hasChkobba = !!chkobbaPlayer;

  useEffect(() => {
    if (hasChkobba) {
      playChkobbaSound();
      const timeout = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(timeout);
    } else {
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [hasChkobba, playChkobbaSound]);

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
          {/* Subtle backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
          />

          {/* Center notification */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: 1 }}
              className="text-6xl sm:text-8xl font-bold tracking-tight text-accent"
            >
              CHKOBBA!
            </motion.div>

            <div className="bg-surface-1 px-8 py-2.5 rounded-xl border border-border">
              <span className="text-text-secondary text-lg sm:text-xl font-medium">
                {chkobbaPlayer} scores!
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

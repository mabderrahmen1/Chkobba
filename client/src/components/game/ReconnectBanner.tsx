import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketStore } from '../../stores/useSocketStore';
import { useUIStore } from '../../stores/useUIStore';

/**
 * Shown when the socket drops during gameplay / lobby so the player knows
 * the client is reconnecting (socket.io reconnection is enabled in socket.ts).
 */
export const ReconnectBanner = memo(function ReconnectBanner() {
  const isConnected = useSocketStore((s) => s.isConnected);
  const screen = useUIStore((s) => s.screen);

  const show =
    !isConnected && (screen === 'game' || screen === 'lobby' || screen === 'createRoom' || screen === 'joinRoom');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute left-1/2 top-2 z-[100] w-[min(calc(100%-1rem),28rem)] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="rounded-xl border border-amber-500/40 bg-black/85 px-4 py-2 text-center shadow-lg backdrop-blur-md">
            <p className="font-ancient text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/95">
              Connexion perdue — reconnexion…
            </p>
            <p className="mt-0.5 text-[10px] text-cream/50">Ne quittez pas la page</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';

export function TurnIndicator() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const chkobbaPlayer = useGameStore((s) => s.chkobbaPlayer);

  if (!gameState || !playerId) return null;

  const isMyTurn = gameState.currentTurn === playerId;

  return (
    <div className="mt-3">
      <AnimatePresence mode="wait">
        {chkobbaPlayer ? (
          <motion.div
            key="chkobba"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="px-4 py-2 bg-accent-warning text-white rounded-lg font-bold text-lg"
          >
            🎉 CHKOBBA by {chkobbaPlayer}!
          </motion.div>
        ) : (
          <motion.div
            key="turn"
            initial={{ opacity: 0 }}
            animate={
              isMyTurn
                ? { opacity: 1, scale: [1, 1.05, 1] }
                : { opacity: 1 }
            }
            transition={isMyTurn ? { duration: 1, repeat: Infinity } : {}}
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              isMyTurn
                ? 'bg-accent-success text-white'
                : 'bg-surface-card text-foreground-secondary'
            }`}
          >
            {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

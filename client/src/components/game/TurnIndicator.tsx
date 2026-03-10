import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';

export function TurnIndicator() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

  if (!gameState || !playerId) return null;

  const isMyTurn = gameState.currentTurn === playerId;

  return (
    <div className="mt-3">
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
    </div>
  );
}

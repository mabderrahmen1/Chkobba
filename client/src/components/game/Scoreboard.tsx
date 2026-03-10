import { useGameStore } from '../../stores/useGameStore';
import { motion } from 'framer-motion';

export function Scoreboard() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

  if (!gameState || !playerId) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return null;

  const myTeam = currentPlayer.team;
  const myScore = myTeam === 0 ? gameState.scores.team0 : gameState.scores.team1;
  const oppScore = myTeam === 0 ? gameState.scores.team1 : gameState.scores.team0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50"
    >
      <div className="bg-black/60 backdrop-blur-md border border-brass/30 rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg">
        <div className="text-[9px] sm:text-[10px] text-brass/70 font-ancient uppercase tracking-widest text-center mb-1">
          Score — First to {gameState.targetScore}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-accent/80 font-ancient uppercase">You</span>
            <span className="text-lg sm:text-2xl font-ancient font-bold text-accent">{myScore}</span>
          </div>
          <div className="text-brass/40 font-ancient text-sm">—</div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-turquoise/80 font-ancient uppercase">Opp</span>
            <span className="text-lg sm:text-2xl font-ancient font-bold text-turquoise">{oppScore}</span>
          </div>
        </div>
        <div className="text-[8px] sm:text-[9px] text-cream/40 font-ancient text-center mt-1">
          Round {gameState.roundNumber}
        </div>
      </div>
    </motion.div>
  );
}

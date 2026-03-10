import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { GameTable } from '../game/GameTable';
import { RoundEndModal } from '../game/RoundEndModal';
import { GameOverModal } from '../game/GameOverModal';
import { AmbianceToggle } from '../game/ambiance/AmbianceToggle';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';

export function GameScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const autoWinWarning = useGameStore((s) => s.autoWinWarning);

  const { playClink, playLighter } = useAmbianceSound();
  const lighterPlayed = useRef(false);
  const prevRound = useRef(gameState?.roundNumber ?? 0);

  // Play lighter flick once on first mount
  useEffect(() => {
    if (!lighterPlayed.current) {
      lighterPlayed.current = true;
      // Small delay so user interaction has occurred
      const t = setTimeout(() => playLighter(), 600);
      return () => clearTimeout(t);
    }
  }, [playLighter]);

  // Play clink on round start
  useEffect(() => {
    if (gameState && gameState.roundNumber !== prevRound.current) {
      prevRound.current = gameState.roundNumber;
      playClink();
    }
  }, [gameState?.roundNumber, playClink, gameState]);

  if (!gameState || !playerId) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col p-1 sm:p-2 relative overflow-hidden"
      style={{ background: '#1a120e' }}
    >
      {/* Ambient cafe lighting */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(90,53,32,0.15) 0%, transparent 40%)'
      }} />
      <div className="absolute top-0 right-10 w-40 h-40 bg-amber-900/8 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-turquoise/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Ambiance controls */}
      <AmbianceToggle />

      <div className="relative z-10 h-full flex flex-col">
        <GameTable />
      </div>

      {autoWinWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 copper-plate text-cream px-6 py-3 rounded-lg text-center"
        >
          <p className="font-ancient text-sm engraved-text">{autoWinWarning.playerNickname} disconnected</p>
          <p className="text-2xl font-ancient font-bold engraved-text mt-1">
            Auto-win in {Math.round(autoWinWarning.timeRemaining / 1000)}s
          </p>
        </motion.div>
      )}

      <RoundEndModal />
      <GameOverModal />
    </motion.section>
  );
}

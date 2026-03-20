import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { GameTable } from '../game/GameTable';
import { Scoreboard } from '../game/Scoreboard';
import { MoveLog } from '../game/MoveLog';
import { ChkobbaEffect } from '../game/ChkobbaEffect';
import { HayyaEffect } from '../game/HayyaEffect';
import { RoundEndModal } from '../game/RoundEndModal';
import { GameOverModal } from '../game/GameOverModal';
import { MusicControl } from '../game/MusicControl';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import { RummyGameScreen } from '../game/RummyGameScreen';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';

export function GameScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const rummyGameState = useGameStore((s) => s.rummyGameState);
  const gameType = useGameStore((s) => s.gameType || s.room?.gameType);
  const playerId = useGameStore((s) => s.playerId);
  const autoWinWarning = useGameStore((s) => s.autoWinWarning);

  const turnStartedAt = useGameStore((s) => s.turnStartedAt);
  const turnTimeoutSec = useGameStore((s) => s.turnTimeoutSec);
  const [countdown, setCountdown] = useState<number | null>(null);

  const isDistributing = useGameStore((s) => s.isDistributing);
  const { playCardShuffle } = useAmbianceSound();
  const prevRound = useRef(gameState?.roundNumber ?? 0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isDistributing) playCardShuffle();
  }, [isDistributing, playCardShuffle]);

  useEffect(() => {
    if (!turnStartedAt || !turnTimeoutSec) { setCountdown(null); return; }
    const tick = () => {
      const elapsed = (Date.now() - turnStartedAt) / 1000;
      setCountdown(Math.ceil(Math.max(0, turnTimeoutSec - elapsed)));
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [turnStartedAt, turnTimeoutSec]);

  if (gameType === 'rummy' || rummyGameState) return <RummyGameScreen />;

  if (!gameState || !playerId || !gameState.players) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-bg">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-text-secondary text-sm animate-pulse">Preparing table...</p>
      </div>
    );
  }

  const isMyTurn = gameState.currentTurn === playerId;
  const turnPlayer = gameState.players.find((p) => p.id === gameState.currentTurn);
  const turnName = turnPlayer
    ? turnPlayer.id === playerId ? "Your Turn" : `${turnPlayer.nickname} is thinking...`
    : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomId)
      .then(() => { setCopied(true); useUIStore.getState().addToast('Room code copied!', 'success'); setTimeout(() => setCopied(false), 2000); })
      .catch(() => useUIStore.getState().addToast('Failed to copy', 'error'));
  };

  return (
    <motion.section
      id="game-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col p-1 sm:p-2 relative overflow-hidden bg-bg"
    >
      <h1 className="sr-only">Chkobba Game</h1>
      <MusicControl />

      {/* Turn Indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.currentTurn}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 right-0 z-[60] flex items-center justify-center pointer-events-none"
          style={{ bottom: 'calc(11.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className={`px-5 py-2 rounded-full border backdrop-blur-sm flex items-center gap-2.5 transition-colors duration-300 ${
            isMyTurn ? 'bg-accent/10 border-accent/30' : 'bg-surface-1/80 border-border'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-accent' : 'bg-text-tertiary'}`} />
            <span className={`text-sm font-medium ${isMyTurn ? 'text-accent' : 'text-text-secondary'}`}>
              {turnName}
            </span>
            {isMyTurn && countdown !== null && turnTimeoutSec !== null && (
              <div className="relative w-7 h-7 flex-shrink-0">
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                  <circle cx="16" cy="16" r="13" fill="none"
                    stroke={countdown <= 10 ? '#FF4757' : '#10B981'}
                    strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 13}`}
                    strokeDashoffset={`${2 * Math.PI * 13 * (1 - countdown / turnTimeoutSec)}`}
                    style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s' }}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center font-mono font-semibold text-[9px] ${countdown <= 10 ? 'text-danger' : 'text-accent'}`}>
                  {countdown}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <Scoreboard />
      <MoveLog />

      {/* Room code */}
      <div className="fixed bottom-3 left-3 z-[45] hidden sm:flex">
        <motion.button whileTap={{ scale: 0.95 }} aria-label="Copy room code" onClick={handleCopyCode}
          className="flex items-center gap-2 bg-surface-1 border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-accent/30 transition-colors text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <span className="text-text-tertiary">Room:</span>
          <span className="text-accent font-mono font-semibold tracking-wider">{gameState.roomId}</span>
        </motion.button>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        <GameTable />
      </div>

      {autoWinWarning && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-surface-1 border border-border text-text-primary px-6 py-4 rounded-xl text-center shadow-lg"
        >
          <p className="text-sm text-text-secondary mb-1">{autoWinWarning.playerNickname} disconnected</p>
          <p className="text-lg font-bold mb-3">Auto-win in {Math.round(autoWinWarning.timeRemaining / 1000)}s</p>
          <Button size="sm" variant="secondary" onClick={() => { if (window.confirm('End match and return to lobby?')) socket.emit('reset_game'); }} className="w-full">Return to Lobby</Button>
        </motion.div>
      )}

      <ChkobbaEffect />
      <HayyaEffect />
      <RoundEndModal />
      <GameOverModal />
    </motion.section>
  );
}

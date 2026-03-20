import { useMemo } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { PlayerZone } from './PlayerZone';
import { TableCards } from './TableCards';
import { PlayerHand } from './PlayerHand';
import { CapturedStack } from './CapturedStack';
import { CaptureAnimationOverlay } from './CaptureAnimationOverlay';
import { DealingAnimation } from './DealingAnimation';
import { motion } from 'framer-motion';

export function GameTable() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const soundEffectsMuted = useUIStore((s) => s.soundEffectsMuted);
  const toggleSoundEffects = useUIStore((s) => s.toggleSoundEffects);

  if (!gameState || !playerId) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return null;

  const is4Player = gameState.players.length >= 4;
  const isMyTurn = gameState.currentTurn === playerId;

  const { opponents, topPlayer, leftPlayer, rightPlayer, myTeamCaptured, oppTeamCaptured } = useMemo(() => {
    const opponents = gameState.players.filter((p) => p.id !== playerId);
    let topPlayer, leftPlayer, rightPlayer;

    if (is4Player) {
      const teammate = opponents.find((p) => p.team === currentPlayer.team);
      const opps = opponents.filter((p) => p.team !== currentPlayer.team);
      topPlayer = teammate;
      const turnOrder = gameState.players.map(p => p.id);
      const myIndex = turnOrder.indexOf(currentPlayer.id);
      const nextPlayerId = turnOrder[(myIndex + 1) % turnOrder.length];
      rightPlayer = opps.find(p => p.id === nextPlayerId) || opps[0];
      leftPlayer = opps.find(p => p.id !== rightPlayer?.id) || opps[1];
    } else {
      topPlayer = opponents[0];
    }

    const team0Captured = gameState.players.filter(p => p.team === 0).reduce((sum, p) => sum + p.capturedCount, 0);
    const team1Captured = gameState.players.filter(p => p.team === 1).reduce((sum, p) => sum + p.capturedCount, 0);
    const myTeamCaptured = currentPlayer.team === 0 ? team0Captured : team1Captured;
    const oppTeamCaptured = currentPlayer.team === 0 ? team1Captured : team0Captured;

    return { opponents, topPlayer, leftPlayer, rightPlayer, myTeamCaptured, oppTeamCaptured };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.players, playerId]);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 md:p-4 relative">
      <CaptureAnimationOverlay />
      <DealingAnimation />

      {/* SFX Mute */}
      <div className="absolute top-4 left-4 z-[60]">
        <button
          onClick={toggleSoundEffects}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-secondary hover:text-text-primary transition-colors"
          title={soundEffectsMuted ? "Unmute SFX" : "Mute SFX"}
          aria-label={soundEffectsMuted ? "Unmute sound effects" : "Mute sound effects"}
        >
          {soundEffectsMuted ? (
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="relative w-full h-full max-w-6xl max-h-[85vh] sm:max-h-[80vh] flex flex-col items-center justify-center z-10 perspective-1000 scale-[0.88] sm:scale-95 md:scale-100">
        <motion.div
          animate={isMyTurn ? { borderColor: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.4)', 'rgba(16,185,129,0.15)'] } : { borderColor: 'rgba(42,42,46,1)' }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-full h-full p-2 sm:p-5 md:p-7 flex flex-col relative overflow-hidden bg-surface-1 border-2 border-border shadow-md"
          style={{ borderRadius: 'clamp(1rem, 4vw, 2rem)' }}
        >
          <div className="flex-1 w-full rounded-[clamp(0.75rem, 3vw, 1.5rem)] flex flex-col relative overflow-hidden bg-surface-2">
            <div className="flex-1 w-full h-full relative z-10 flex flex-col justify-center items-center py-2 sm:py-8 md:py-12">
              <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5">
                <CapturedStack count={myTeamCaptured} label="Ours" variant="ally" />
              </div>
              <div className="absolute top-3 right-3 sm:top-5 sm:right-5">
                <CapturedStack count={oppTeamCaptured} label="Theirs" variant="opponent" />
              </div>
              <TableCards cards={gameState.tableCards} />
            </div>
          </div>
        </motion.div>

        {/* Player Zones */}
        <div className="absolute top-[-5px] sm:top-[-20px] left-1/2 -translate-x-1/2 z-30">
          {topPlayer && <PlayerZone player={topPlayer} position="top" isCurrentTurn={gameState.currentTurn === topPlayer.id} isTeammate={topPlayer.team === currentPlayer.team} />}
        </div>
        {is4Player && leftPlayer && (
          <div className="absolute left-[-5px] sm:left-[-30px] md:left-[-40px] top-1/2 -translate-y-1/2 z-30">
            <PlayerZone player={leftPlayer} position="left" isCurrentTurn={gameState.currentTurn === leftPlayer.id} isTeammate={leftPlayer.team === currentPlayer.team} />
          </div>
        )}
        {is4Player && rightPlayer && (
          <div className="absolute right-[-5px] sm:right-[-30px] md:right-[-40px] top-1/2 -translate-y-1/2 z-30">
            <PlayerZone player={rightPlayer} position="right" isCurrentTurn={gameState.currentTurn === rightPlayer.id} isTeammate={rightPlayer.team === currentPlayer.team} />
          </div>
        )}
      </div>

      {/* Hand */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[95vw] sm:max-w-2xl z-50 px-2 sm:px-0" style={{ bottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <PlayerHand />
      </div>
    </div>
  );
}

import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { PlayerZone } from './PlayerZone';
import { TableCards } from './TableCards';
import { PlayerHand } from './PlayerHand';
import { CapturedStack } from './CapturedStack';
import { CafeAmbiance } from './ambiance/CafeAmbiance';
import { CaptureAnimationOverlay } from './CaptureAnimationOverlay';
import { DealingAnimation } from './DealingAnimation';
import { motion } from 'framer-motion';
import { socket } from '../../lib/socket';

export function GameTable() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const soundEffectsMuted = useUIStore((s) => s.soundEffectsMuted);
  const toggleSoundEffects = useUIStore((s) => s.toggleSoundEffects);

  if (!gameState || !playerId) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return null;

  const opponents = gameState.players.filter((p) => p.id !== playerId);
  const is4Player = gameState.players.length >= 4;
  const isMyTurn = gameState.currentTurn === playerId;

  let topPlayer, leftPlayer, rightPlayer;

  if (is4Player) {
    const teammate = opponents.find((p) => p.team === currentPlayer.team);
    const opps = opponents.filter((p) => p.team !== currentPlayer.team);
    
    // Position teammate at top (across from you)
    topPlayer = teammate;
    
    // Position opponents based on turn order
    // Find which opponent plays right after you (should be on your right)
    // and which plays after your teammate (should be on your left)
    const turnOrder = gameState.players.map(p => p.id);
    const myIndex = turnOrder.indexOf(currentPlayer.id);
    const nextPlayerIndex = (myIndex + 1) % turnOrder.length;
    const nextPlayerId = turnOrder[nextPlayerIndex];
    
    // The opponent who plays right after you goes on the right
    rightPlayer = opps.find(p => p.id === nextPlayerId) || opps[0];
    leftPlayer = opps.find(p => p.id !== rightPlayer?.id) || opps[1];
  } else {
    topPlayer = opponents[0];
  }

  // Calculate captured counts per team
  const team0Captured = gameState.players
    .filter(p => p.team === 0)
    .reduce((sum, p) => sum + p.capturedCount, 0);
  const team1Captured = gameState.players
    .filter(p => p.team === 1)
    .reduce((sum, p) => sum + p.capturedCount, 0);

  const myTeamCaptured = currentPlayer.team === 0 ? team0Captured : team1Captured;
  const oppTeamCaptured = currentPlayer.team === 0 ? team1Captured : team0Captured;

  return (
    <div className="flex-1 w-full h-full cafe-scene flex flex-col items-center justify-center p-1 sm:p-2 md:p-4 relative">
      <CaptureAnimationOverlay />
      <DealingAnimation />

      {/* Mute Button */}
      <div className="absolute top-4 left-4 z-[60]">
        <button
          onClick={toggleSoundEffects}
          className="p-2 rounded-full bg-black/40 border border-brass/30 text-brass hover:bg-black/60 transition-all shadow-lg"
          title={soundEffectsMuted ? "Unmute SFX" : "Mute SFX"}
        >
          {soundEffectsMuted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* Background Silhouettes & Lighting */}
      <div className="vignette" />
      <div className="ambient-light top-[-100px] left-[-100px] animate-ambient-glow" />
      <div className="ambient-light bottom-[-100px] right-[-100px] animate-ambient-glow" style={{ animationDelay: '3s' }} />

      {/* The Wooden Table Scene */}
      <div className="relative w-full h-full max-w-6xl max-h-[85vh] sm:max-h-[80vh] flex flex-col items-center justify-center z-10 perspective-1000 scale-[0.8] sm:scale-90 md:scale-100">

        {/* Table Container */}
        <div 
          className="w-full h-full p-1.5 sm:p-4 md:p-6 flex flex-col relative overflow-hidden bg-wood shadow-theme-lg"
          style={{
            borderRadius: 'clamp(1rem, 5vw, 3rem)',
            border: 'clamp(4px, 1.5vw, 12px) solid #2d1606',
          }}
        >
          {/* Subtle wood grain texture */}
          <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />

          {/* The Felt Center */}
          <motion.div
            animate={isMyTurn ? {
              borderColor: ['rgba(212,175,55,0.2)', 'rgba(212,175,55,0.6)', 'rgba(212,175,55,0.2)'],
            } : {
              borderColor: 'rgba(0,0,0,0.5)',
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex-1 w-full rounded-[clamp(0.75rem, 4vw, 2rem)] flex flex-col relative overflow-hidden border-2 bg-felt-luxury"
          >
            {/* Grid Layout inside the Felt */}
            <div className="flex-1 w-full h-full relative z-10 flex flex-col justify-center items-center py-2 sm:py-8 md:py-12">

              {/* Ambiance Props */}
              <div className="absolute inset-0 z-30 pointer-events-none">
                <CafeAmbiance />
              </div>

              {/* Captured Stacks */}
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4">
                <CapturedStack count={myTeamCaptured} label="Our Cards" variant="ally" />
              </div>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                <CapturedStack count={oppTeamCaptured} label="Their Cards" variant="opponent" />
              </div>

              {/* Table Cards */}
              <TableCards cards={gameState.tableCards} />
            </div>
          </motion.div>
        </div>

        {/* Player Zones (positioned around the table) */}
        <div className="absolute top-[-5px] sm:top-[-20px] left-1/2 -translate-x-1/2 z-30">
          {topPlayer && (
            <PlayerZone
              player={topPlayer}
              position="top"
              isCurrentTurn={gameState.currentTurn === topPlayer.id}
              isTeammate={topPlayer.team === currentPlayer.team}
            />
          )}
        </div>

        {is4Player && leftPlayer && (
          <div className="absolute left-[-5px] sm:left-[-30px] md:left-[-40px] top-1/2 -translate-y-1/2 z-30">
            <PlayerZone
              player={leftPlayer}
              position="left"
              isCurrentTurn={gameState.currentTurn === leftPlayer.id}
              isTeammate={leftPlayer.team === currentPlayer.team}
            />
          </div>
        )}

        {is4Player && rightPlayer && (
          <div className="absolute right-[-5px] sm:right-[-30px] md:right-[-40px] top-1/2 -translate-y-1/2 z-30">
            <PlayerZone
              player={rightPlayer}
              position="right"
              isCurrentTurn={gameState.currentTurn === rightPlayer.id}
              isTeammate={rightPlayer.team === currentPlayer.team}
            />
          </div>
        )}
      </div>

      {/* Hand area at bottom */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[95vw] sm:max-w-2xl z-50 px-2 sm:px-0">
        <PlayerHand />
      </div>
    </div>
  );
}

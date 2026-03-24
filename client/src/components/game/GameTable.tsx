import { useGameStore } from '../../stores/useGameStore';
import { PlayerZone } from './PlayerZone';
import { TableCards } from './TableCards';
import { PlayerHand } from './PlayerHand';
import { CapturedStack } from './CapturedStack';
import { CafeAmbiance } from './ambiance/CafeAmbiance';
import { CaptureAnimationOverlay } from './CaptureAnimationOverlay';
import { DealingAnimation } from './DealingAnimation';
import { TurnIndicator } from './TurnIndicator';
import { motion } from 'framer-motion';
import { socket } from '../../lib/socket';

export function GameTable() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

  if (!gameState || !playerId) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return null;

  const players = gameState.players;
  const is4Player = players.length >= 4;
  const isMyTurn = gameState.currentTurn === playerId;

  let topPlayer: (typeof players)[number] | undefined;
  let leftPlayer: (typeof players)[number] | undefined;
  let rightPlayer: (typeof players)[number] | undefined;

  if (is4Player && players.length === 4) {
    // Seat order in `players` is the table ring (lobby join order). Put "me" at seat 0 (bottom);
    // then clockwise: right → across (top/teammate in 2v2) → left.
    const mySeat = players.findIndex((p) => p.id === playerId);
    if (mySeat >= 0) {
      const ring = [...players.slice(mySeat), ...players.slice(0, mySeat)];
      // ring[0] = self (bottom), ring[1] = right, ring[2] = top, ring[3] = left
      rightPlayer = ring[1];
      topPlayer = ring[2];
      leftPlayer = ring[3];
    }
  } else {
    const opponents = players.filter((p) => p.id !== playerId);
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
    <div className="flex-1 min-h-0 w-full flex flex-col cafe-scene overflow-hidden p-1 sm:p-2 md:p-4 relative">
      <CaptureAnimationOverlay />
      <DealingAnimation />

      {/* Background Silhouettes & Lighting */}
      <div className="vignette" />
      <div className="ambient-light top-[-100px] left-[-100px] animate-ambient-glow" />
      <div className="ambient-light bottom-[-100px] right-[-100px] animate-ambient-glow" style={{ animationDelay: '3s' }} />

      {/* The Wooden Table Scene — flex-1 consumes space above hand + turn strip */}
      <div className="relative w-full flex-1 min-h-0 max-w-6xl mx-auto flex flex-col items-stretch justify-center z-10 perspective-1000 scale-[0.76] min-[400px]:scale-[0.82] sm:scale-90 md:scale-100">

        {/* Table Container */}
        <div 
          className="w-full flex-1 min-h-0 max-h-full p-1.5 sm:p-4 md:p-6 flex flex-col relative overflow-hidden bg-wood shadow-theme-lg"
          style={{
            borderRadius: 'clamp(1rem, 5vw, 3rem)',
            border: 'clamp(4px, 1.5vw, 12px) solid #2d1606',
          }}
        >
          {/* Subtle wood grain texture */}
          <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02 0.15' numOctaves='5' seed='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23w)' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }} />

          {/* The Felt Center */}
          <motion.div
            animate={isMyTurn ? {
              borderColor: ['rgba(212,175,55,0.2)', 'rgba(212,175,55,0.6)', 'rgba(212,175,55,0.2)'],
            } : {
              borderColor: 'rgba(0,0,0,0.5)',
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex-1 w-full min-h-0 rounded-[clamp(0.75rem, 4vw, 2rem)] flex flex-col relative overflow-x-auto overflow-y-hidden border-2 bg-felt-luxury"
          >
            {/* Grid Layout inside the Felt */}
            <div
              className="flex-1 w-full h-full min-h-0 min-w-0 relative z-10 flex flex-col justify-center items-center py-2 sm:py-6 md:py-10 overflow-x-auto overscroll-x-contain"
              data-table-felt-center
            >

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

      <TurnIndicator />

      {/* Hand — in document flow so it never overlaps the table or fixed UI */}
      <div className="shrink-0 w-full max-w-[min(42rem,calc(100vw-0.5rem))] mx-auto z-30 px-1 sm:px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <PlayerHand />
      </div>
    </div>
  );
}

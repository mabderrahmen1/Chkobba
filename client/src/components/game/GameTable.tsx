import { useGameStore } from '../../stores/useGameStore';
import { PlayerZone } from './PlayerZone';
import { TableCards } from './TableCards';
import { PlayerHand } from './PlayerHand';
import { CapturedStack } from './CapturedStack';
import { CafeAmbiance } from './ambiance/CafeAmbiance';
import { CaptureAnimationOverlay } from './CaptureAnimationOverlay';
import { motion } from 'framer-motion';
import { socket } from '../../lib/socket';

export function GameTable() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

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
    <div className="flex-1 w-full h-full cafe-scene flex flex-col items-center justify-center p-1 sm:p-2 md:p-4">
      <CaptureAnimationOverlay />
      
      {/* Background Silhouettes & Lighting */}
      <div className="vignette" />
      <div className="ambient-light top-[-100px] left-[-100px]" />
      <div className="ambient-light bottom-[-100px] right-[-100px]" />

      {/* The Wooden Table Scene */}
      <div className="relative w-full h-full max-w-6xl max-h-[85vh] sm:max-h-[80vh] flex flex-col items-center justify-center z-10">

        {/* Table Container */}
        <div 
          className="w-full h-full p-2 sm:p-4 md:p-6 flex flex-col relative overflow-hidden"
          style={{
            borderRadius: '2rem',
            border: '8px solid rgba(139, 69, 19, 0.4)',
            background: 'linear-gradient(180deg, #2d1606 0%, #1c0d04 100%)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 10px 20px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.1)'
          }}
        >
          {/* Subtle scratches and texture overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />

          {/* The Felt Center — glow border when it's your turn */}
          <motion.div
            animate={isMyTurn ? {
              boxShadow: [
                'inset 0 0 80px rgba(0,0,0,0.8), 0 0 0px rgba(212,175,55,0)',
                'inset 0 0 80px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.5)',
                'inset 0 0 80px rgba(0,0,0,0.8), 0 0 0px rgba(212,175,55,0)',
              ],
            } : {
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8)',
            }}
            transition={isMyTurn ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
            className="flex-1 w-full rounded-2xl flex flex-col relative overflow-hidden border border-black/50"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, rgba(58, 107, 53, 0.95) 0%, rgba(45, 84, 41, 0.98) 60%, rgba(30, 58, 28, 1) 100%)',
            }}
          >
            {/* Subtle felt texture overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            }} />

            {/* Embossed pattern */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
               <svg width="200" height="200" viewBox="0 0 100 100" className="text-black fill-current sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px]">
                 <path d="M50 5 L58 35 L90 35 L64 55 L74 85 L50 67 L26 85 L36 55 L10 35 L42 35 Z" />
               </svg>
            </div>

            {/* Grid Layout inside the Felt */}
            <div className="flex-1 w-full h-full relative z-10 flex flex-col justify-center items-center py-4 sm:py-8 md:py-12">

              {/* Ambiance Props (positioned on top of the felt but on edges) */}
              <div className="absolute inset-0 z-30 pointer-events-none">
                <CafeAmbiance />
              </div>

              {/* Captured Stacks (on felt) */}
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
        <div className="absolute top-[-10px] sm:top-[-20px] left-1/2 -translate-x-1/2 z-30">
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
          <div className="absolute left-[-20px] sm:left-[-30px] md:left-[-40px] top-1/2 -translate-y-1/2 z-30">
            <PlayerZone
              player={leftPlayer}
              position="left"
              isCurrentTurn={gameState.currentTurn === leftPlayer.id}
              isTeammate={leftPlayer.team === currentPlayer.team}
            />
          </div>
        )}

        {is4Player && rightPlayer && (
          <div className="absolute right-[-20px] sm:right-[-30px] md:right-[-40px] top-1/2 -translate-y-1/2 z-30">
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

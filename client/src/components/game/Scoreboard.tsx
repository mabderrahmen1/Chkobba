import { useGameStore } from '../../stores/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      setFlash(true);
      setDisplay(value);
      prev.current = value;
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <motion.span
      key={display}
      initial={{ scale: 1 }}
      animate={flash ? { scale: [1, 1.35, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {display}
    </motion.span>
  );
}

/** Show who gets the point: "you", "opp", or "—" for tie */
function PointIndicator({ my, opp }: { my: number; opp: number }) {
  if (my > opp) return <span className="text-accent text-[7px] sm:text-[8px] font-bold">+1</span>;
  if (opp > my) return <span className="text-turquoise text-[7px] sm:text-[8px] font-bold">+1</span>;
  return <span className="text-cream/20 text-[7px] sm:text-[8px]">—</span>;
}

export function Scoreboard() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const [expanded, setExpanded] = useState(false);

  if (!gameState || !playerId) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return null;

  const myTeam = currentPlayer.team;
  const myScore = myTeam === 0 ? gameState.scores.team0 : gameState.scores.team1;
  const oppScore = myTeam === 0 ? gameState.scores.team1 : gameState.scores.team0;

  // Live round stats
  const myTeamPlayers = gameState.players.filter(p => p.team === myTeam);
  const oppTeamPlayers = gameState.players.filter(p => p.team !== myTeam);

  const myCards = myTeamPlayers.reduce((s, p) => s + p.capturedCount, 0);
  const oppCards = oppTeamPlayers.reduce((s, p) => s + p.capturedCount, 0);
  const myChkobba = myTeamPlayers.reduce((s, p) => s + p.chkobbaCount, 0);
  const oppChkobba = oppTeamPlayers.reduce((s, p) => s + p.chkobbaCount, 0);
  const myDinari = myTeamPlayers.reduce((s, p) => s + p.dinariCount, 0);
  const oppDinari = oppTeamPlayers.reduce((s, p) => s + p.dinariCount, 0);
  const mySevens = myTeamPlayers.reduce((s, p) => s + p.sevensCount, 0);
  const oppSevens = oppTeamPlayers.reduce((s, p) => s + p.sevensCount, 0);

  // Round score (live)
  const myRoundScore = myTeam === 0 ? gameState.roundScores.team0 : gameState.roundScores.team1;
  const oppRoundScore = myTeam === 0 ? gameState.roundScores.team1 : gameState.roundScores.team0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50"
    >
      <div
        className="bg-black/60 backdrop-blur-md border border-brass/30 rounded-xl shadow-lg cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Main scores */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="text-[8px] sm:text-[9px] text-brass/60 font-ancient uppercase tracking-widest text-center mb-0.5">
            First to {gameState.targetScore}
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center min-w-[32px]">
              <span className="text-[8px] sm:text-[9px] text-accent/70 font-ancient uppercase">You</span>
              <AnimatedNumber value={myScore} className="text-lg sm:text-2xl font-ancient font-bold text-accent" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-brass/30 font-ancient text-[10px]">vs</span>
              <span className="text-[7px] text-cream/30 font-ancient">R{gameState.roundNumber}</span>
            </div>
            <div className="flex flex-col items-center min-w-[32px]">
              <span className="text-[8px] sm:text-[9px] text-turquoise/70 font-ancient uppercase">Opp</span>
              <AnimatedNumber value={oppScore} className="text-lg sm:text-2xl font-ancient font-bold text-turquoise" />
            </div>
          </div>
        </div>

        {/* Expandable live round details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-brass/15 px-3 py-2 sm:px-4 sm:py-2.5">
                <div className="text-[7px] sm:text-[8px] text-brass/50 font-ancient uppercase tracking-widest text-center mb-1.5">
                  This Round
                </div>
                <div className="grid grid-cols-[1fr_auto_auto_1fr] gap-x-1.5 gap-y-1 text-[9px] sm:text-[10px] font-ancient items-center">
                  {/* Header */}
                  <div className="text-right text-[7px] text-accent/50 uppercase">You</div>
                  <div />
                  <div />
                  <div className="text-left text-[7px] text-turquoise/50 uppercase">Opp</div>

                  {/* Carta — total cards */}
                  <div className="text-right">
                    <AnimatedNumber value={myCards} className="text-accent font-bold" />
                  </div>
                  <div className="text-cream/30 text-center text-[8px]">Carta</div>
                  <PointIndicator my={myCards} opp={oppCards} />
                  <div className="text-left">
                    <AnimatedNumber value={oppCards} className="text-turquoise font-bold" />
                  </div>

                  {/* Dinari — diamond cards */}
                  <div className="text-right">
                    <AnimatedNumber value={myDinari} className="text-accent font-bold" />
                  </div>
                  <div className="text-cream/30 text-center text-[8px]">Dinari</div>
                  <PointIndicator my={myDinari} opp={oppDinari} />
                  <div className="text-left">
                    <AnimatedNumber value={oppDinari} className="text-turquoise font-bold" />
                  </div>

                  {/* Bermila — 7s count */}
                  <div className="text-right">
                    <AnimatedNumber value={mySevens} className="text-accent font-bold" />
                  </div>
                  <div className="text-cream/30 text-center text-[8px]">Bermila</div>
                  <PointIndicator my={mySevens} opp={oppSevens} />
                  <div className="text-left">
                    <AnimatedNumber value={oppSevens} className="text-turquoise font-bold" />
                  </div>

                  {/* Chkobba sweeps */}
                  <div className="text-right">
                    <AnimatedNumber value={myChkobba} className="text-accent font-bold" />
                  </div>
                  <div className="text-cream/30 text-center text-[8px]">Chkobba</div>
                  <div className="text-center">
                    {myChkobba > 0 && <span className="text-accent text-[7px] sm:text-[8px] font-bold">+{myChkobba}</span>}
                    {oppChkobba > 0 && <span className="text-turquoise text-[7px] sm:text-[8px] font-bold">+{oppChkobba}</span>}
                    {myChkobba === 0 && oppChkobba === 0 && <span className="text-cream/20 text-[7px] sm:text-[8px]">—</span>}
                  </div>
                  <div className="text-left">
                    <AnimatedNumber value={oppChkobba} className="text-turquoise font-bold" />
                  </div>

                  {/* Round score total */}
                  <div className="text-right pt-1 border-t border-brass/10">
                    <AnimatedNumber value={myRoundScore} className="text-accent font-bold text-[10px] sm:text-xs" />
                  </div>
                  <div className="text-cream/40 text-center text-[8px] pt-1 border-t border-brass/10">Pts</div>
                  <div className="pt-1 border-t border-brass/10" />
                  <div className="text-left pt-1 border-t border-brass/10">
                    <AnimatedNumber value={oppRoundScore} className="text-turquoise font-bold text-[10px] sm:text-xs" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

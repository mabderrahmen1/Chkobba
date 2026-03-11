import { useGameStore } from '../../stores/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { generateCardSVG } from '../../lib/cardUtils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';

function CardIcon({ rank, suit, className }: { rank: string; suit: string; className?: string }) {
  const svg = generateCardSVG(rank, suit);
  return (
    <div 
      className={`w-6 h-9 sm:w-7 sm:h-10 rounded-sm overflow-hidden shadow-md border border-white/10 bg-white/5 ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

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

function PointIndicator({ my, opp }: { my: number; opp: number }) {
  if (my > opp) return <span className="text-accent text-[10px] font-bold font-ancient">+1</span>;
  if (opp > my) return <span className="text-turquoise text-[10px] font-bold font-ancient">+1</span>;
  return <span className="text-white/10 text-[10px] font-ancient">—</span>;
}

export function Scoreboard() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!gameState || !playerId) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return null;

  const myTeam = currentPlayer.team;
  const myScore = myTeam === 0 ? gameState.scores.team0 : gameState.scores.team1;
  const oppScore = myTeam === 0 ? gameState.scores.team1 : gameState.scores.team0;

  const oppPlayer = gameState.players.find((p) => p.team !== myTeam);
  const myNickname = currentPlayer.nickname;
  const oppNickname = oppPlayer ? oppPlayer.nickname : 'Opponent';

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
  const myHasHaya = myTeamPlayers.some(p => p.hasHaya);
  const oppHasHaya = oppTeamPlayers.some(p => p.hasHaya);

  const myRoundScore = myTeam === 0 ? gameState.roundScores.team0 : gameState.roundScores.team1;
  const oppRoundScore = myTeam === 0 ? gameState.roundScores.team1 : gameState.roundScores.team0;

  const StatRow = ({ label, myVal, oppVal, icon, pointMy, pointOpp }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="w-12 text-right">
        <AnimatedNumber value={myVal} className="text-accent font-ancient font-bold text-xl" />
      </div>
      
      <div className="flex flex-col items-center flex-1 px-4">
        {icon && <div className="mb-2">{icon}</div>}
        <span className="text-[11px] text-cream font-ancient uppercase tracking-[0.25em] font-bold text-center leading-none mb-1 opacity-90">
          {label}
        </span>
        <div className="h-4 flex items-center justify-center">
          {pointMy !== undefined ? (
            <PointIndicator my={pointMy} opp={pointOpp} />
          ) : (
            (myVal > 0 || oppVal > 0) ? (
               <div className="flex gap-4">
                  {myVal > 0 && <span className="text-accent text-[10px] font-bold font-ancient">+{myVal}</span>}
                  {oppVal > 0 && <span className="text-turquoise text-[10px] font-bold font-ancient">+{oppVal}</span>}
               </div>
            ) : <span className="text-white/5 text-[10px] font-ancient">—</span>
          )}
        </div>
      </div>

      <div className="w-12 text-left">
        <AnimatedNumber value={oppVal} className="text-turquoise font-ancient font-bold text-xl" />
      </div>
    </div>
  );

  const renderStatsContent = () => (
    <div className="bg-black/40 rounded-xl border border-brass/10 p-4 sm:p-6 shadow-inner">
      <StatRow label="CARTA" myVal={myCards} oppVal={oppCards} pointMy={myCards} pointOpp={oppCards} />
      
      <StatRow 
        label="DINARI" 
        myVal={myDinari} 
        oppVal={oppDinari} 
        pointMy={myDinari} 
        pointOpp={oppDinari}
        icon={<CardIcon rank="A" suit="diamonds" className="ring-1 ring-brass/30" />}
      />

      <StatRow 
        label="BERMILA" 
        myVal={mySevens} 
        oppVal={oppSevens} 
        pointMy={mySevens} 
        pointOpp={oppSevens}
        icon={
          <div className="flex -space-x-2">
            <CardIcon rank="7" suit="spades" />
            <CardIcon rank="7" suit="hearts" />
          </div>
        }
      />

      <StatRow 
        label="7 HAYA" 
        myVal={myHasHaya ? 1 : 0} 
        oppVal={oppHasHaya ? 1 : 0} 
        icon={<CardIcon rank="7" suit="diamonds" className="ring-2 ring-brass/50 shadow-glow-gold" />}
      />

      <StatRow label="CHKOBBA" myVal={myChkobba} oppVal={oppChkobba} />

      <div className="mt-6 pt-4 border-t border-brass/10 flex items-center justify-between px-2 opacity-60">
        <div className="text-center min-w-[60px]">
          <div className="text-[8px] text-accent uppercase font-ancient font-bold mb-0.5 tracking-wider">Session</div>
          <span className="text-2xl font-ancient font-bold text-accent">{currentPlayer.wins || 0}</span>
        </div>
        <div className="text-[10px] text-brass/40 font-ancient font-bold uppercase tracking-[0.3em] px-4">Wins</div>
        <div className="text-center min-w-[60px]">
          <div className="text-[8px] text-turquoise uppercase font-ancient font-bold mb-0.5 tracking-wider">Session</div>
          <span className="text-2xl font-ancient font-bold text-turquoise">{oppPlayer?.wins || 0}</span>
        </div>
      </div>

      <div className="mt-4 pt-5 border-t-2 border-brass/20 flex items-center justify-between px-2">
        <div className="text-center min-w-[60px]">
          <div className="text-[10px] text-accent font-ancient font-bold uppercase tracking-widest mb-1 shadow-sm">Round</div>
          <AnimatedNumber value={myRoundScore} className="text-3xl font-ancient font-bold text-accent drop-shadow-glow-accent" />
        </div>
        
        <div className="flex flex-col items-center">
           <div className="h-8 w-[1px] bg-brass/20 mb-1" />
           <div className="text-[11px] text-brass-light font-ancient font-bold uppercase tracking-[0.3em] px-4 py-1 bg-brass/5 rounded-full border border-brass/10">Total</div>
        </div>

        <div className="text-center min-w-[60px]">
          <div className="text-[10px] text-turquoise font-ancient font-bold uppercase tracking-widest mb-1 shadow-sm">Round</div>
          <AnimatedNumber value={oppRoundScore} className="text-3xl font-ancient font-bold text-turquoise drop-shadow-glow-turquoise" />
        </div>
      </div>

      <div className="mt-8 flex justify-center border-t border-white/5 pt-6">
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to forfeit the match? The other team will win immediately.')) {
              socket.emit('forfeit');
              setExpanded(false);
            }
          }}
          className="text-[9px] text-red-500/60 hover:text-red-500 font-ancient uppercase tracking-[0.2em] border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-lg transition-all"
        >
          Forfeit Match
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[45]"
    >
      <motion.div
        layout
        className="bg-black/90 backdrop-blur-2xl border border-brass/40 rounded-2xl shadow-2xl cursor-pointer select-none overflow-hidden"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="px-4 py-3 sm:px-5 sm:py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 min-w-[180px] sm:min-w-[220px]">
          {/* My Score */}
          <div className="flex flex-col items-center text-center">
            <div className="flex flex-col items-center mb-1">
              <span className="text-[9px] text-accent/60 font-ancient uppercase tracking-wider truncate w-full max-w-[60px] sm:max-w-[80px] leading-tight">
                {myNickname}
              </span>
              <span className="text-[7px] text-accent/40 font-ancient font-bold">
                {currentPlayer.wins || 0} - {currentPlayer.losses || 0}
              </span>
            </div>
            <AnimatedNumber value={myScore} className="text-2xl sm:text-3xl font-ancient font-bold text-accent drop-shadow-glow-accent" />
          </div>

          {/* VS & Round Center */}
          <div className="flex flex-col items-center justify-center px-1 sm:px-2">
             <div className="flex items-center gap-1.5 opacity-40 mb-1">
                <div className="w-2 sm:w-3 h-[1px] bg-brass/50" />
                <span className="text-[8px] sm:text-[9px] text-brass font-bold uppercase tracking-tighter">VS</span>
                <div className="w-2 sm:w-3 h-[1px] bg-brass/50" />
             </div>
             <div className="px-2 py-0.5 rounded bg-brass/10 border border-brass/20 shadow-inner">
                <span className="text-[8px] sm:text-[9px] text-brass font-ancient font-bold uppercase tracking-widest whitespace-nowrap">
                  RD {gameState.roundNumber}
                </span>
             </div>
          </div>

          {/* Opponent Score */}
          <div className="flex flex-col items-center text-center">
            <div className="flex flex-col items-center mb-1">
              <span className="text-[9px] text-turquoise/60 font-ancient uppercase tracking-wider truncate w-full max-w-[60px] sm:max-w-[80px] leading-tight">
                {oppNickname}
              </span>
              <span className="text-[7px] text-turquoise/40 font-ancient font-bold">
                {oppPlayer?.wins || 0} - {oppPlayer?.losses || 0}
              </span>
            </div>
            <AnimatedNumber value={oppScore} className="text-2xl sm:text-3xl font-ancient font-bold text-turquoise drop-shadow-glow-turquoise" />
          </div>
        </div>

        {/* Desktop Inline expansion */}
        {!isMobile && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-black/40"
              >
                <div className="p-4 border-t border-brass/20">
                   {renderStatsContent()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Mobile Modal */}
      {isMobile && (
        <Modal isOpen={expanded} onClose={() => setExpanded(false)}>
           <div className="flex flex-col items-center pt-2">
              <div className="w-full text-brass font-ancient uppercase tracking-[0.4em] text-center mb-8 border-b border-brass/20 pb-4 text-xl font-bold">
                Live Stats
              </div>
              <div className="w-full px-1 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {renderStatsContent()}
              </div>
              <div className="mt-10 flex justify-center w-full">
                <Button variant="secondary" onClick={() => setExpanded(false)} className="w-full py-4 text-lg">Close</Button>
              </div>
           </div>
        </Modal>
      )}
    </motion.div>
  );
}

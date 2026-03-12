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
      className={`w-7 h-10 sm:w-9 sm:h-13 rounded-sm overflow-hidden shadow-glow-brass/20 border border-white/10 bg-white/5 transition-transform ${className}`}
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
      animate={flash ? { scale: [1, 1.35, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {display}
    </motion.span>
  );
}

function PointIndicator({ my, opp, active }: { my: number; opp: number; active?: boolean }) {
  if (my > opp) return (
    <motion.div animate={active ? { scale: [1, 1.2, 1] } : {}} className="flex items-center gap-1">
      <span className="text-accent text-[10px] font-bold font-ancient shadow-glow-accent">+1 PT</span>
    </motion.div>
  );
  if (opp > my) return (
    <div className="flex items-center gap-1">
      <span className="text-turquoise text-[10px] font-bold font-ancient shadow-glow-turquoise">+1 PT</span>
    </div>
  );
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

  const StatRow = ({ label, myVal, oppVal, icon, pointMy, pointOpp }: any) => {
    const isLeading = pointMy > pointOpp;
    const isLosing = pointOpp > pointMy;

    return (
      <div className={`flex items-center justify-between py-4 border-b border-white/5 last:border-0 relative ${isLeading ? 'bg-accent/5' : isLosing ? 'bg-turquoise/5' : ''} transition-colors px-2 rounded-lg`}>
        <div className="w-14 text-right">
          <AnimatedNumber value={myVal} className={`font-ancient font-bold text-xl sm:text-2xl ${isLeading ? 'text-accent drop-shadow-glow-accent' : 'text-accent'}`} />
        </div>
        
        <div className="flex flex-col items-center flex-1 px-4">
          {icon && <motion.div whileHover={{ scale: 1.1 }} className="mb-2.5 drop-shadow-2xl">{icon}</motion.div>}
          <span className="text-[11px] sm:text-xs text-cream font-ancient uppercase tracking-[0.3em] font-bold text-center leading-none mb-1.5 opacity-90">
            {label}
          </span>
          <div className="h-5 flex items-center justify-center">
            {pointMy !== undefined ? (
              <PointIndicator my={pointMy} opp={pointOpp} active={true} />
            ) : (
              (myVal > 0 || oppVal > 0) ? (
                 <div className="flex gap-6">
                    {myVal > 0 && <span className="text-accent text-xs font-bold font-ancient shadow-glow-accent">+{myVal}</span>}
                    {oppVal > 0 && <span className="text-turquoise text-xs font-bold font-ancient shadow-glow-turquoise">+{oppVal}</span>}
                 </div>
              ) : <span className="text-white/5 text-[10px] font-ancient">—</span>
            )}
          </div>
        </div>

        <div className="w-14 text-left">
          <AnimatedNumber value={oppVal} className={`font-ancient font-bold text-xl sm:text-2xl ${isLosing ? 'text-turquoise drop-shadow-glow-turquoise' : 'text-turquoise'}`} />
        </div>
      </div>
    );
  };

  const renderStatsContent = () => (
    <div className="bg-black/60 rounded-2xl border border-brass/20 p-4 sm:p-8 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-brass/30 rounded-tl-lg" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-brass/30 rounded-tr-lg" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-brass/30 rounded-bl-lg" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-brass/30 rounded-br-lg" />

      <div className="space-y-2">
        <StatRow label="CARTA" myVal={myCards} oppVal={oppCards} pointMy={myCards} pointOpp={oppCards} />
        
        <StatRow 
          label="DINARI" 
          myVal={myDinari} 
          oppVal={oppDinari} 
          pointMy={myDinari} 
          pointOpp={oppDinari}
          icon={<CardIcon rank="A" suit="diamonds" className="ring-2 ring-brass/40 rotate-[-2deg]" />}
        />

        <StatRow 
          label="BERMILA" 
          myVal={mySevens} 
          oppVal={oppSevens} 
          pointMy={mySevens} 
          pointOpp={oppSevens}
          icon={
            <div className="flex -space-x-4">
              <CardIcon rank="7" suit="spades" className="rotate-[-8deg] -translate-x-1" />
              <CardIcon rank="7" suit="hearts" className="rotate-[8deg] translate-x-1" />
            </div>
          }
        />

        <StatRow 
          label="7 HAYA" 
          myVal={myHasHaya ? 1 : 0} 
          oppVal={oppHasHaya ? 1 : 0} 
          icon={<CardIcon rank="7" suit="diamonds" className="ring-2 ring-accent shadow-glow-gold scale-110" />}
        />

        <StatRow label="CHKOBBA" myVal={myChkobba} oppVal={oppChkobba} />
      </div>

      <div className="mt-8 pt-6 border-t-2 border-brass/30 flex items-center justify-between px-4 bg-brass/5 rounded-b-xl pb-2">
        <div className="text-center min-w-[70px]">
          <div className="text-[10px] text-accent font-ancient font-bold uppercase tracking-widest mb-1 opacity-50">Round Pts</div>
          <AnimatedNumber value={myRoundScore} className="text-4xl font-ancient font-bold text-accent drop-shadow-glow-accent" />
        </div>
        
        <div className="flex flex-col items-center">
           <div className="text-[12px] text-brass font-ancient font-bold uppercase tracking-[0.4em] px-6 py-2 bg-black/60 rounded-full border border-brass/40 shadow-glow-brass/10">TOTAL</div>
        </div>

        <div className="text-center min-w-[70px]">
          <div className="text-[10px] text-turquoise font-ancient font-bold uppercase tracking-widest mb-1 opacity-50">Round Pts</div>
          <AnimatedNumber value={oppRoundScore} className="text-4xl font-ancient font-bold text-turquoise drop-shadow-glow-turquoise" />
        </div>
      </div>

      <div className="mt-10 flex justify-center border-t border-white/5 pt-8">
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            socket.emit('forfeit');
            setExpanded(false);
          }}
          className="group flex flex-col items-center gap-1.5 px-10 py-3 rounded-2xl border border-red-500/20 transition-all"
        >
          <span className="text-[11px] text-red-500/80 group-hover:text-red-500 font-ancient uppercase tracking-[0.3em] font-bold">
            Concede Match
          </span>
          <span className="text-[8px] text-red-500/30 uppercase tracking-widest font-ancient group-hover:text-red-500/50">Forfeit Session</span>
        </motion.button>
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
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="bg-black/95 backdrop-blur-3xl border border-brass/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] cursor-pointer select-none overflow-hidden"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="px-5 py-4 sm:px-6 sm:py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8 min-w-[200px] sm:min-w-[240px]">
          <div className="flex flex-col items-center text-center">
            <div className="flex flex-col items-center mb-1.5">
              <span className="text-[10px] text-accent/80 font-ancient uppercase font-bold tracking-[0.15em] truncate w-full max-w-[70px] sm:max-w-[90px] leading-tight">
                {myNickname}
              </span>
              <div className="h-[1px] w-4 bg-accent/20 my-0.5" />
              <span className="text-[8px] text-accent/50 font-ancient font-bold tracking-tighter">
                {currentPlayer.wins || 0} — {currentPlayer.losses || 0}
              </span>
            </div>
            <AnimatedNumber value={myScore} className="text-3xl sm:text-4xl font-ancient font-bold text-accent drop-shadow-glow-accent" />
          </div>

          <div className="flex flex-col items-center justify-center px-2">
             <div className="flex items-center gap-2 opacity-60 mb-1.5">
                <div className="w-4 h-[1px] bg-gradient-to-r from-transparent to-brass" />
                <span className="text-[10px] text-brass font-bold uppercase tracking-widest">VS</span>
                <div className="w-4 h-[1px] bg-gradient-to-l from-transparent to-brass" />
             </div>
             <div className="px-3 py-1 rounded-full bg-brass/10 border border-brass/30 shadow-inner">
                <span className="text-[9px] text-brass-light font-ancient font-bold uppercase tracking-[0.25em] whitespace-nowrap">
                  ROUND {gameState.roundNumber}
                </span>
             </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex flex-col items-center mb-1.5">
              <span className="text-[10px] text-turquoise/80 font-ancient uppercase font-bold tracking-[0.15em] truncate w-full max-w-[70px] sm:max-w-[90px] leading-tight">
                {oppNickname}
              </span>
              <div className="h-[1px] w-4 bg-turquoise/20 my-0.5" />
              <span className="text-[8px] text-turquoise/50 font-ancient font-bold tracking-tighter">
                {oppPlayer?.wins || 0} — {oppPlayer?.losses || 0}
              </span>
            </div>
            <AnimatedNumber value={oppScore} className="text-3xl sm:text-4xl font-ancient font-bold text-turquoise drop-shadow-glow-turquoise" />
          </div>
        </div>

        {!isMobile && (
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  height: { type: "spring", stiffness: 300, damping: 35 },
                  opacity: { duration: 0.25, ease: "linear" }
                }}
                className="overflow-hidden bg-black/60"
              >
                <div className="p-6 border-t border-brass/30">
                   <div className="text-[11px] text-brass font-ancient uppercase tracking-[0.4em] text-center mb-8 border-b border-brass/10 pb-4 font-bold">
                      LIVE MATCH TRACKER
                   </div>
                   {renderStatsContent()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {isMobile && (
        <Modal isOpen={expanded} onClose={() => setExpanded(false)}>
           <div className="flex flex-col items-center">
              <div className="w-full flex items-center justify-center gap-4 mb-8 border-b border-brass/20 pb-5">
                <div className="w-8 h-px bg-brass/30" />
                <div className="text-brass font-ancient uppercase tracking-[0.4em] text-center text-xl font-bold">
                  Match Stats
                </div>
                <div className="w-8 h-px bg-brass/30" />
              </div>
              <div className="w-full px-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {renderStatsContent()}
              </div>
              <div className="mt-8 flex justify-center w-full">
                <Button variant="secondary" onClick={() => setExpanded(false)} className="w-full py-5 text-xl font-ancient tracking-[0.2em]">Close</Button>
              </div>
           </div>
        </Modal>
      )}
    </motion.div>
  );
}

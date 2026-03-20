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
      className={`w-7 h-10 sm:w-9 sm:h-13 rounded-sm overflow-hidden border border-border bg-surface-3 transition-transform ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (value !== displayValue) {
      previousValue.current = displayValue;
      setDisplayValue(value);
    }
  }, [value, displayValue]);

  const isIncrementing = value > previousValue.current;

  return (
    <div className={`relative inline-flex overflow-hidden ${className}`} style={{ height: '1.2em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={displayValue}
          initial={{ y: isIncrementing ? 40 : -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isIncrementing ? -40 : 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center leading-none"
        >
          {displayValue}
        </motion.span>
      </AnimatePresence>
      <span className="invisible pointer-events-none flex items-center justify-center leading-none">
        {displayValue}
      </span>
    </div>
  );
}

function StatRow({ label, myVal, oppVal, icon, pointMy, pointOpp }: any) {
  const isLeading = pointMy > pointOpp;
  const isLosing = pointOpp > pointMy;

  return (
    <div className={`flex items-center justify-between py-4 border-b border-border last:border-0 relative transition-all duration-300 px-3 rounded-xl mb-1 ${
      isLeading ? 'bg-team1/10' :
      isLosing ? 'bg-team2/10' :
      'bg-surface-3'
    }`}>
      {/* My Team Column */}
      <div className="w-16 flex flex-col items-end">
        <AnimatedNumber
          value={myVal}
          className={`font-bold text-2xl sm:text-3xl ${isLeading ? 'text-team1' : 'text-text-tertiary'}`}
        />
        {pointMy > pointOpp && (
          <span className="text-[8px] font-bold text-team1 uppercase tracking-tighter">+1 POINT</span>
        )}
      </div>

      {/* Center Label/Icon Column */}
      <div className="flex flex-col items-center flex-1 px-4">
        {icon && (
          <div className="mb-3 z-10">
            {icon}
          </div>
        )}
        <span className="text-[10px] sm:text-[11px] text-text-tertiary uppercase tracking-widest font-semibold text-center leading-none">
          {label}
        </span>
      </div>

      {/* Opponent Column */}
      <div className="w-16 flex flex-col items-start">
        <AnimatedNumber
          value={oppVal}
          className={`font-bold text-2xl sm:text-3xl ${isLosing ? 'text-team2' : 'text-text-tertiary'}`}
        />
        {oppVal > myVal && (
          <span className="text-[8px] font-bold text-team2 uppercase tracking-tighter">+1 POINT</span>
        )}
      </div>
    </div>
  );
}

export function Scoreboard() {
  const gameState = useGameStore((s) => s.gameState);
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const storeIsHost = useGameStore((s) => s.isHost);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (!confirmLeave) return;
    const timer = setTimeout(() => setConfirmLeave(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmLeave]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!gameState || !playerId) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return null;

  const isHost = storeIsHost || (room?.hostId === playerId);

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

  const handleReturnToLobby = () => {
    socket.emit('reset_game');
  };

  const renderStatsContent = () => (
    <div className="bg-surface-2 rounded-2xl border border-border p-4 sm:p-6 relative overflow-hidden">
      <div className="space-y-1">
        <StatRow label="CARTA" myVal={myCards} oppVal={oppCards} pointMy={myCards} pointOpp={oppCards} />

        <StatRow
          label="DINARI"
          myVal={myDinari}
          oppVal={oppDinari}
          pointMy={myDinari}
          pointOpp={oppDinari}
          icon={<CardIcon rank="A" suit="diamonds" className="rotate-[-4deg] scale-110" />}
        />

        <StatRow
          label="BERMILA"
          myVal={mySevens}
          oppVal={oppSevens}
          pointMy={mySevens}
          pointOpp={oppSevens}
          icon={
            <div className="flex -space-x-5">
              <CardIcon rank="7" suit="spades" className="rotate-[-12deg] -translate-x-1" />
              <CardIcon rank="7" suit="hearts" className="rotate-[12deg] translate-x-1" />
            </div>
          }
        />

        <StatRow
          label="7 HAYA"
          myVal={myHasHaya ? 1 : 0}
          oppVal={oppHasHaya ? 1 : 0}
          pointMy={myHasHaya ? 1 : 0}
          pointOpp={oppHasHaya ? 1 : 0}
          icon={<CardIcon rank="7" suit="diamonds" className="ring-2 ring-team1 scale-125 z-20" />}
        />

        <StatRow label="CHKOBBA" myVal={myChkobba} oppVal={oppChkobba} pointMy={myChkobba} pointOpp={oppChkobba} />
      </div>

      <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
        {isHost && (
          <Button
            variant="primary"
            onClick={handleReturnToLobby}
            className="w-full py-4 text-xs tracking-wider"
          >
            End Match & Edit Rules
          </Button>
        )}

        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-center">
            <div className="text-[9px] text-team1/60 font-semibold uppercase tracking-wider mb-1">Round</div>
            <AnimatedNumber value={myRoundScore} className="text-3xl font-bold text-team1" />
          </div>

          <div className="bg-surface-3 px-5 py-2 rounded-xl border border-border">
            <span className="text-[10px] text-text-tertiary font-semibold uppercase tracking-widest">TOTAL PTS</span>
          </div>

          <div className="text-center">
            <div className="text-[9px] text-team2/60 font-semibold uppercase tracking-wider mb-1">Round</div>
            <AnimatedNumber value={oppRoundScore} className="text-3xl font-bold text-team2" />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (!confirmLeave) {
              setConfirmLeave(true);
              return;
            }
            socket.emit('leave_room');
            useUIStore.getState().setIsSubmitting(false);
            useUIStore.getState().setScreen('landing');
            sessionStorage.removeItem('chkobba-storage');
            setTimeout(() => {
              useGameStore.getState().reset();
            }, 100);
          }}
          className={`w-full flex flex-col items-center justify-center py-4 rounded-xl border group transition-all min-h-[44px] ${
            confirmLeave
              ? 'border-danger/50 bg-danger/15 animate-pulse'
              : 'border-danger/20 bg-danger/5'
          }`}
        >
          <span className={`text-[11px] group-hover:text-danger/70 uppercase tracking-widest font-semibold ${
            confirmLeave ? 'text-danger/70' : 'text-danger'
          }`}>
            {confirmLeave ? 'Tap Again to Confirm' : 'Leave Game'}
          </span>
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
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`Scoreboard — ${myNickname} ${myScore} vs ${oppNickname} ${oppScore}. Click to ${expanded ? 'collapse' : 'expand'} stats`}
        className="bg-surface-1 rounded-2xl border border-border shadow-lg cursor-pointer select-none overflow-hidden min-w-[220px] sm:min-w-[280px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onClick={() => setExpanded(e => !e)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
      >
        <div className="px-6 py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 relative overflow-hidden">
          <div className="flex flex-col items-center text-center relative z-10">
            <span className={`text-[10px] sm:text-[11px] uppercase font-semibold tracking-wider truncate w-full max-w-[80px] mb-1 ${
              myScore >= oppScore ? 'text-team1' : 'text-text-tertiary'
            }`}>
              {myNickname}
            </span>
            <AnimatedNumber
              value={myScore}
              className={`text-4xl sm:text-5xl font-bold ${
                myScore > oppScore ? 'text-team1' :
                myScore === oppScore ? 'text-text-secondary' : 'text-team1/40'
              }`}
            />
          </div>

          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="text-[10px] text-text-tertiary font-semibold mb-1">VS</div>
            <div className="px-3 py-1 rounded-lg bg-surface-3 border border-border">
              <span className="text-[9px] text-text-secondary font-semibold uppercase tracking-wider whitespace-nowrap">
                RD {gameState.roundNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center relative z-10">
            <span className={`text-[10px] sm:text-[11px] uppercase font-semibold tracking-wider truncate w-full max-w-[80px] mb-1 ${
              oppScore >= myScore ? 'text-team2' : 'text-text-tertiary'
            }`}>
              {oppNickname}
            </span>
            <AnimatedNumber
              value={oppScore}
              className={`text-4xl sm:text-5xl font-bold ${
                oppScore > myScore ? 'text-team2' :
                oppScore === myScore ? 'text-text-secondary' : 'text-team2/40'
              }`}
            />
          </div>
        </div>

        {!isMobile && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="p-6 border-t border-border">
                  <div className="text-[11px] text-text-tertiary uppercase tracking-widest text-center mb-8 font-semibold">
                    LIVE STATS
                  </div>
                  {renderStatsContent()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {isMobile && (
        <Modal isOpen={expanded} onClose={() => setExpanded(false)} ariaLabel="Match Progress">
          <div className="flex flex-col items-center">
            <div className="w-full flex flex-col items-center mb-8 border-b border-border pb-6">
              <h2 className="text-text-primary uppercase tracking-widest text-2xl font-bold mb-2">
                Match Progress
              </h2>
              <div className="w-12 h-1 bg-border rounded-full" />
            </div>
            <div className="w-full px-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {renderStatsContent()}
            </div>
            <div className="mt-8 w-full">
              <Button variant="secondary" onClick={() => setExpanded(false)} className="w-full py-5 text-lg">Close Dashboard</Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}

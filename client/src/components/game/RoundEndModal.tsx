import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { socket } from '../../lib/socket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function RoundEndModal() {
  const roundResult = useGameStore((s) => s.roundResult);
  const gameState = useGameStore((s) => s.gameState);
  const rummyGameState = useGameStore((s) => s.rummyGameState);
  const playerId = useGameStore((s) => s.playerId);
  const setRoundResult = useGameStore((s) => s.setRoundResult);
  const [waiting, setWaiting] = useState(false);

  const gameType = useGameStore((s) => s.gameType);
  const isRummy = gameType === 'rummy';

  const gameIsOver = isRummy ? !!rummyGameState?.winner : !!gameState?.winner;

  const handleContinue = () => {
    if (gameIsOver) {
      setRoundResult(null);
      return;
    }
    setWaiting(true);
    socket.emit('continue_round');
  };

  if (!roundResult && waiting) {
    setWaiting(false);
  }

  const chkobbaCategories = !isRummy && roundResult?.breakdown
    ? [
        { name: 'Carta (Most Cards)', scores: roundResult.breakdown.carta },
        { name: 'Dinari (Most Diamonds)', scores: roundResult.breakdown.dinari },
        { name: 'Bermila (Most 7s)', scores: roundResult.breakdown.bermila },
        { name: 'Sabaa el Haya (7\u2666)', scores: roundResult.breakdown.sabaaElHaya },
        { name: 'Chkobba (Sweeps)', scores: roundResult.breakdown.chkobba },
      ]
    : [];

  return (
    <Modal isOpen={!!roundResult}>
      <h3 className="text-xl sm:text-2xl font-ancient font-bold text-brass mb-4 sm:mb-6">
        {isRummy ? 'Round Won!' : 'Round Over!'}
      </h3>
      
      {isRummy ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl">
            <span className="text-emerald-400 font-ancient text-lg uppercase tracking-widest block mb-1">Winner</span>
            <span className="text-white font-bold text-2xl">{roundResult?.winnerNickname}</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-cream/40 text-[10px] uppercase tracking-[0.2em] font-bold">Penalty Points</span>
            <div className="grid grid-cols-2 gap-2">
              {rummyGameState?.players.map(p => (
                <div key={p.id} className="bg-black/40 p-2 rounded-lg border border-white/5 flex justify-between items-center px-4">
                  <span className="text-cream-dark text-xs truncate max-w-[80px]">{p.nickname}</span>
                  <span className="text-red-400 font-bold">{roundResult?.penalties?.[p.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-left">
          {/* Header row */}
          <div className="flex justify-between px-4 py-1">
            <span className="text-foreground-muted text-xs font-ancient uppercase tracking-wider">Category</span>
            <div className="flex gap-4">
              <span className="text-accent text-xs font-ancient font-semibold w-8 text-center">T1</span>
              <span className="text-turquoise text-xs font-ancient font-semibold w-8 text-center">T2</span>
            </div>
          </div>
          {chkobbaCategories.map((cat) => (
            <div
              key={cat.name}
              className="flex justify-between px-4 py-2.5 bg-surface-card rounded-lg border border-brass/10"
            >
              <span className="text-cream-dark text-xs sm:text-sm font-body">{cat.name}</span>
              <div className="flex gap-4">
                <span className="font-bold text-accent w-8 text-center">{cat.scores.team0}</span>
                <span className="font-bold text-turquoise w-8 text-center">{cat.scores.team1}</span>
              </div>
            </div>
          ))}
          {roundResult && (
            <div className="flex justify-between px-4 py-3 mt-2 border-t border-brass/20 pt-4">
              <span className="font-ancient font-bold text-brass">Total</span>
              <div className="flex gap-4">
                <span className="font-bold text-accent w-8 text-center">{roundResult.totals.team0}</span>
                <span className="font-bold text-turquoise w-8 text-center">{roundResult.totals.team1}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {gameState && !isRummy && (
        <div className="flex justify-between px-4 py-3 mt-4 bg-surface-card rounded-lg border border-brass/20">
          <span className="font-ancient font-bold text-brass">Overall</span>
          <div className="flex gap-4">
            <span className="font-bold text-accent w-8 text-center">{gameState.scores.team0}</span>
            <span className="font-bold text-turquoise w-8 text-center">{gameState.scores.team1}</span>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        {waiting ? (
          <p className="text-cream-dark/60 font-ancient text-sm italic text-center animate-pulse">
            Waiting for other players...
          </p>
        ) : (
          <Button onClick={handleContinue} className="min-w-[160px]">Continue</Button>
        )}
      </div>
    </Modal>
  );
}

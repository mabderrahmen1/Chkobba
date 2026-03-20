import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { socket } from '../../lib/socket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { ChkobbaRoundResult, RummyRoundResult } from '@shared/types.js';

export function RoundEndModal() {
  const roundResult = useGameStore((s) => s.roundResult);
  const gameState = useGameStore((s) => s.gameState);
  const rummyGameState = useGameStore((s) => s.rummyGameState);
  const setRoundResult = useGameStore((s) => s.setRoundResult);
  const [waiting, setWaiting] = useState(false);

  const gameType = useGameStore((s) => s.gameType);
  const isRummy = gameType === 'rummy';

  const chkobbaResult = !isRummy ? roundResult as ChkobbaRoundResult : null;
  const rummyResult = isRummy ? roundResult as RummyRoundResult : null;

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

  const chkobbaCategories = chkobbaResult?.breakdown
    ? [
        { name: 'Carta (Most Cards)', scores: chkobbaResult.breakdown.carta },
        { name: 'Dinari (Most Diamonds)', scores: chkobbaResult.breakdown.dinari },
        { name: 'Bermila (Most 7s)', scores: chkobbaResult.breakdown.bermila },
        { name: 'Sabaa el Haya (7\u2666)', scores: chkobbaResult.breakdown.sabaaElHaya },
        { name: 'Chkobba (Sweeps)', scores: chkobbaResult.breakdown.chkobba },
      ]
    : [];

  return (
    <Modal isOpen={!!roundResult}>
      <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
        {isRummy ? 'Round Won!' : 'Round Over!'}
      </h3>

      {isRummy ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="bg-success/10 border border-success/30 p-4 rounded-xl">
            <span className="text-success font-semibold text-sm uppercase tracking-wider block mb-1">Winner</span>
            <span className="text-text-primary font-bold text-2xl">{rummyResult?.winnerNickname}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-text-tertiary text-xs uppercase tracking-wider font-semibold">Penalty Points</span>
            <div className="grid grid-cols-2 gap-2">
              {rummyGameState?.players.map(p => (
                <div key={p.id} className="bg-surface-2 p-2 rounded-lg border border-border flex justify-between items-center px-4">
                  <span className="text-text-secondary text-xs truncate max-w-[80px]">{p.nickname}</span>
                  <span className="text-danger font-bold">{rummyResult?.penalties?.[p.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 text-left">
          {/* Header row */}
          <div className="flex justify-between px-4 py-1">
            <span className="text-text-tertiary text-xs uppercase tracking-wider">Category</span>
            <div className="flex gap-4">
              <span className="text-team1 text-xs font-semibold w-8 text-center">T1</span>
              <span className="text-team2 text-xs font-semibold w-8 text-center">T2</span>
            </div>
          </div>
          {chkobbaCategories.map((cat) => (
            <div
              key={cat.name}
              className="flex justify-between px-4 py-2.5 bg-surface-2 rounded-lg border border-border"
            >
              <span className="text-text-secondary text-xs sm:text-sm">{cat.name}</span>
              <div className="flex gap-4">
                <span className="font-bold text-team1 w-8 text-center">{cat.scores.team0}</span>
                <span className="font-bold text-team2 w-8 text-center">{cat.scores.team1}</span>
              </div>
            </div>
          ))}
          {chkobbaResult && (
            <div className="flex justify-between px-4 py-3 mt-2 border-t border-border pt-4">
              <span className="font-semibold text-text-primary">Total</span>
              <div className="flex gap-4">
                <span className="font-bold text-team1 w-8 text-center">{chkobbaResult.totals.team0}</span>
                <span className="font-bold text-team2 w-8 text-center">{chkobbaResult.totals.team1}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {gameState && !isRummy && (
        <div className="flex justify-between px-4 py-3 mt-4 bg-surface-2 rounded-lg border border-border">
          <span className="font-semibold text-text-primary">Overall</span>
          <div className="flex gap-4">
            <span className="font-bold text-team1 w-8 text-center">{gameState.scores.team0}</span>
            <span className="font-bold text-team2 w-8 text-center">{gameState.scores.team1}</span>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        {waiting ? (
          <p className="text-text-tertiary text-sm italic text-center animate-pulse">
            Waiting for other players...
          </p>
        ) : (
          <Button onClick={handleContinue} className="min-w-[160px]">Continue</Button>
        )}
      </div>
    </Modal>
  );
}

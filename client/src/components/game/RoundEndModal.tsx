import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { socket } from '../../lib/socket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function RoundEndModal() {
  const roundResult = useGameStore((s) => s.roundResult);
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const setRoundResult = useGameStore((s) => s.setRoundResult);
  const [waiting, setWaiting] = useState(false);

  const gameIsOver = !!gameState?.winner;

  const handleContinue = () => {
    if (gameIsOver) {
      // Game is over — just dismiss the round summary so GameOverModal shows
      setRoundResult(null);
      return;
    }
    setWaiting(true);
    socket.emit('continue_round');
  };

  // If roundResult is null, reset waiting for next time
  if (!roundResult && waiting) {
    setWaiting(false);
  }

  const categories = roundResult
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
      <h3 className="text-xl sm:text-2xl font-ancient font-bold text-brass mb-4 sm:mb-6">Round Over!</h3>
      <div className="flex flex-col gap-2 text-left">
        {/* Header row */}
        <div className="flex justify-between px-4 py-1">
          <span className="text-foreground-muted text-xs font-ancient uppercase tracking-wider">Category</span>
          <div className="flex gap-4">
            <span className="text-accent text-xs font-ancient font-semibold w-8 text-center">T1</span>
            <span className="text-turquoise text-xs font-ancient font-semibold w-8 text-center">T2</span>
          </div>
        </div>
        {categories.map((cat) => (
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
      {gameState && (
        <div className="flex justify-between px-4 py-3 mt-2 bg-surface-card rounded-lg border border-brass/20">
          <span className="font-ancient font-bold text-brass">Overall</span>
          <div className="flex gap-4">
            <span className="font-bold text-accent w-8 text-center">{gameState.scores.team0}</span>
            <span className="font-bold text-turquoise w-8 text-center">{gameState.scores.team1}</span>
          </div>
        </div>
      )}
      <div className="mt-6">
        {waiting ? (
          <p className="text-cream-dark/60 font-ancient text-sm italic text-center">
            Waiting for other players...
          </p>
        ) : (
          <Button onClick={handleContinue}>Continue</Button>
        )}
      </div>
    </Modal>
  );
}

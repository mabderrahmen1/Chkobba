import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function GameOverModal() {
  const gameOverData = useGameStore((s) => s.gameOverData);
  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const reset = useGameStore((s) => s.reset);
  const setGameOverData = useGameStore((s) => s.setGameOverData);
  const setScreen = useUIStore((s) => s.setScreen);

  if (!gameOverData) return null;

  const { winner, scores } = gameOverData;

  const playerTeam = gameState?.players.find((p) => p.id === playerId)?.team ?? -1;
  const didWin = playerTeam === winner.team;
  const isForfeit = winner.reason === 'opponents_timeout' || winner.reason === 'timeout';

  const handleNewGame = () => {
    setGameOverData(null);
    reset();
    setScreen('landing');
  };

  const handleBackToLobby = () => {
    setGameOverData(null);
    useGameStore.getState().setGameState(null as any);
    socket.emit('reset_lobby');
  };

  return (
    <Modal isOpen={!!gameOverData}>
      <h3 className="text-2xl font-ancient font-bold text-brass mb-4">Game Over!</h3>
      <p className={`text-xl font-ancient font-bold mb-6 ${didWin ? 'text-accent-success' : 'text-accent'}`}>
        {isForfeit
          ? `Team ${winner.team + 1} wins by forfeit!`
          : didWin
            ? 'You Win!'
            : 'You Lose!'}
      </p>
      <div className="flex flex-col gap-2 mb-6 p-4 bg-surface-card rounded-lg border border-brass/10">
        <div className="flex justify-between p-2">
          <span className="text-cream-dark font-ancient">Team 1</span>
          <span className="font-bold text-accent font-ancient">{scores.team0}</span>
        </div>
        <div className="flex justify-between p-2">
          <span className="text-cream-dark font-ancient">Team 2</span>
          <span className="font-bold text-turquoise font-ancient">{scores.team1}</span>
        </div>
      </div>
      <div className="flex gap-4 justify-center">
        <Button variant="secondary" onClick={handleNewGame}>Leave</Button>
        <Button onClick={handleBackToLobby}>Back to Lobby</Button>
      </div>
    </Modal>
  );
}

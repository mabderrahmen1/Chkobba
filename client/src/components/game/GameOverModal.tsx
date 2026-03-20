import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import { useEffect } from 'react';

export function GameOverModal() {
  const gameOverData = useGameStore((s) => s.gameOverData);
  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const rummyGameState = useGameStore((s) => s.rummyGameState);
  const { playChkobbaSound } = useAmbianceSound();

  const isHost = useGameStore((s) => s.room ? s.room.hostId === s.playerId : s.isHost);

  const reset = useGameStore((s) => s.reset);
  const setGameOverData = useGameStore((s) => s.setGameOverData);
  const setScreen = useUIStore((s) => s.setScreen);

  const isRummy = !gameState && !!rummyGameState;

  const { winner, scores } = gameOverData || { winner: { team: -1 }, scores: { team0: 0, team1: 0 } };

  const activePlayers = isRummy ? (rummyGameState?.players || []) : (gameState?.players || []);
  const playerTeam = (activePlayers as any[]).find((p) => p.id === playerId)?.team ?? -1;
  const didWin = winner?.players?.includes(useGameStore.getState().nickname) || playerTeam === winner?.team;
  const isForfeit = winner?.reason === 'opponents_timeout' || winner?.reason === 'timeout' || winner?.reason === 'forfeit';

  useEffect(() => {
    if (gameOverData && didWin && !isForfeit) {
      playChkobbaSound();
    }
  }, [gameOverData, didWin, isForfeit, playChkobbaSound]);

  if (!gameOverData || (!gameState && !rummyGameState)) return null;

  const handlePlayAgain = () => {
    setGameOverData(null);
    socket.emit('play_again');
  };

  const handleBackToLobby = () => {
    setGameOverData(null);
    useUIStore.getState().setScreen('lobby');
    socket.emit('reset_game');
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    useUIStore.getState().setIsSubmitting(false);
    useUIStore.getState().setScreen('landing');
    sessionStorage.removeItem('chkobba-storage');
    setTimeout(() => {
      setGameOverData(null);
      useGameStore.getState().reset();
    }, 100);
  };

  const myNickname = useGameStore.getState().nickname;
  const myPlayer = (activePlayers as any[]).find(p => p.id === playerId);
  const oppPlayer = (activePlayers as any[]).find(p => p.id !== playerId);
  const oppNickname = oppPlayer?.nickname || 'Opponent';

  return (
    <Modal isOpen={!!gameOverData}>
      <h3 className="text-2xl font-bold text-text-primary mb-4">Match Results</h3>
      <p className={`text-xl font-bold mb-6 ${didWin ? 'text-success' : 'text-danger'}`}>
        {isForfeit
          ? `${winner.players.join(' & ')} won by forfeit!`
          : didWin
            ? 'Victory!'
            : 'Defeat'}
      </p>

      <div className="flex flex-col gap-4 mb-8">
        <div className="text-xs text-text-tertiary uppercase tracking-wider text-center mb-1">Final Score</div>
        <div className="flex justify-center items-center gap-8 bg-surface-2 p-6 rounded-xl border border-border">
          <div className="flex flex-col items-center">
            <span className="text-xs text-team1 font-medium uppercase mb-1">{myNickname}</span>
            <span className="text-4xl font-bold text-team1">{scores.team0}</span>
            <span className="text-xs text-text-tertiary font-medium mt-2 tracking-wider uppercase">
              SESSION: {myPlayer?.wins || 0} - {myPlayer?.losses || 0}
            </span>
          </div>

          <div className="text-text-tertiary text-xl">VS</div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-team2 font-medium uppercase mb-1">{oppNickname}</span>
            <span className="text-4xl font-bold text-team2">{scores.team1}</span>
            <span className="text-xs text-text-tertiary font-medium mt-2 tracking-wider uppercase">
              SESSION: {oppPlayer?.wins || 0} - {oppPlayer?.losses || 0}
            </span>
          </div>
        </div>
      </div>

      {isHost ? (
        <div className="flex flex-col gap-3">
          <Button className="w-full py-4 text-lg" onClick={handlePlayAgain}>Play Again</Button>
          <Button className="w-full" variant="secondary" onClick={handleBackToLobby}>Back to Lobby</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="p-4 bg-surface-2 border border-border rounded-lg text-center">
            <p className="text-text-secondary animate-pulse text-sm">
              Waiting for host to replay...
            </p>
          </div>
          <Button className="w-full" variant="danger" onClick={handleLeaveRoom}>Leave Room</Button>
        </div>
      )}
    </Modal>
  );
}

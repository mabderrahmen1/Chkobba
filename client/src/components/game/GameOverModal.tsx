import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function GameOverModal() {
  const gameOverData = useGameStore((s) => s.gameOverData);
  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const rummyGameState = useGameStore((s) => s.rummyGameState);
  const room = useGameStore((s) => s.room);
  
  // Use reactive selector for isHost
  // If we have room data, check hostId. Fallback to store's isHost.
  const isHost = useGameStore((s) => s.room ? s.room.hostId === s.playerId : s.isHost);
  
  const reset = useGameStore((s) => s.reset);
  const setGameOverData = useGameStore((s) => s.setGameOverData);
  const setScreen = useUIStore((s) => s.setScreen);

  const isRummy = !gameState && !!rummyGameState;
  if (!gameOverData || (!gameState && !rummyGameState)) return null;

  const { winner, scores } = gameOverData;

  const activePlayers = isRummy ? rummyGameState!.players : gameState!.players;
  const playerTeam = (activePlayers as any[]).find((p) => p.id === playerId)?.team ?? -1;
  const didWin = winner.players?.includes(useGameStore.getState().nickname) || playerTeam === winner.team;
  const isForfeit = winner.reason === 'opponents_timeout' || winner.reason === 'timeout' || winner.reason === 'forfeit';

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
    // 1. Move to landing first while data still exists
    setScreen('landing');
    
    // 2. Clear local session
    sessionStorage.removeItem('chkobba-storage');
    
    // 3. Notify server
    socket.emit('leave_room');
    
    // 4. Wipe internal state after a tiny delay to allow navigation
    setTimeout(() => {
      setGameOverData(null);
      reset();
    }, 100);
  };

  const myNickname = useGameStore.getState().nickname;
  const myPlayer = (activePlayers as any[]).find(p => p.id === playerId);
  const oppPlayer = (activePlayers as any[]).find(p => p.id !== playerId);
  const oppNickname = oppPlayer?.nickname || 'Opponent';

  return (
    <Modal isOpen={!!gameOverData}>
      <h3 className="text-2xl font-ancient font-bold text-brass mb-4 uppercase tracking-wider">Match Results</h3>
      <p className={`text-xl font-ancient font-bold mb-6 ${didWin ? 'text-accent-success' : 'text-accent'}`}>
        {isForfeit
          ? `${winner.players.join(' & ')} won by forfeit!`
          : didWin
            ? 'Victory!'
            : 'Defeat'}
      </p>
      
      <div className="flex flex-col gap-4 mb-8">
        <div className="text-[10px] text-brass/40 uppercase font-ancient tracking-[0.2em] text-center mb-1">Final Score</div>
        <div className="flex justify-center items-center gap-8 bg-surface-card p-6 rounded-xl border border-brass/10 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-xs text-accent font-ancient uppercase mb-1">{myNickname}</span>
            <span className="text-4xl font-ancient font-bold text-accent">{scores.team0}</span>
            <span className="text-[9px] text-accent/40 font-ancient font-bold mt-2 tracking-widest uppercase">
              SESSION: {myPlayer?.wins || 0} - {myPlayer?.losses || 0}
            </span>
          </div>
          
          <div className="text-brass/20 font-ancient text-xl">VS</div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-turquoise font-ancient uppercase mb-1">{oppNickname}</span>
            <span className="text-4xl font-ancient font-bold text-turquoise">{scores.team1}</span>
            <span className="text-[9px] text-turquoise/40 font-ancient font-bold mt-2 tracking-widest uppercase">
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
          <div className="p-4 bg-brass/5 border border-brass/10 rounded-lg text-center">
            <p className="text-brass font-ancient animate-pulse uppercase tracking-widest text-sm">
              Waiting for host to replay...
            </p>
          </div>
          <Button className="w-full" variant="danger" onClick={handleLeaveRoom}>Leave Room</Button>
        </div>
      )}
    </Modal>
  );
}

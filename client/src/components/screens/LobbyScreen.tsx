import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function LobbyScreen() {
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = useGameStore((s) => s.isHost);
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);
  const reset = useGameStore((s) => s.reset);

  if (!room) return null;

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isReady = currentPlayer?.isReady;

  const handleCopy = () => {
    navigator.clipboard
      ?.writeText(room.id)
      .then(() => addToast('Room code copied!', 'success'))
      .catch(() => addToast('Failed to copy', 'error'));
  };

  const handleReady = () => {
    socket.emit('player_ready');
  };

  const handleStart = () => {
    socket.emit('start_game');
  };

  const handleLeave = () => {
    socket.emit('leave_room');
    reset();
    setScreen('landing');
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex items-center justify-center overflow-y-auto relative"
    >
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(90,53,32,0.3) 0%, rgba(26,18,14,1) 70%)'
      }} />

      <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-8 max-w-xl w-full py-4 sm:py-8 relative z-10">
        <div className="text-center">
          <h2 className="text-2xl font-ancient font-bold text-brass mb-4">Lobby</h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-cream-dark/60 font-ancient text-sm">Room:</span>
            <span className="font-mono text-2xl tracking-widest bg-surface-card px-4 py-2 rounded-lg text-brass border border-brass/20">
              {room.id}
            </span>
            <Button size="sm" variant="secondary" onClick={handleCopy}>Copy</Button>
          </div>
        </div>

        <div className="text-center text-cream-dark/50 flex justify-center gap-4 flex-wrap font-ancient text-sm">
          <span>Target: {room.targetScore}</span>
          <span className="text-brass/20">|</span>
          <span>{room.maxPlayers} Players</span>
        </div>

        <div className="flex flex-col gap-2 bg-surface-card/50 rounded-xl p-4 border border-brass/10">
          {room.players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-4 bg-surface-card rounded-lg border border-theme-border ${
                !player.isConnected ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-ancient font-medium text-cream">{player.nickname}</span>
                {player.isHost && <Badge variant="host">Host</Badge>}
                {player.isReady && <Badge variant="ready">Ready</Badge>}
              </div>
              <Badge variant={player.team === 0 ? 'team0' : 'team1'}>
                Team {player.team + 1}
              </Badge>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-4 flex-wrap">
          <Button onClick={handleReady} disabled={isReady} className="flex-1 min-w-[120px]">
            {isReady ? '\u2713 Ready' : 'Ready'}
          </Button>
          {isHost && room.players.length >= 2 && (
            <Button variant="success" onClick={handleStart} className="flex-1 min-w-[120px]">
              Start Game
            </Button>
          )}
          <Button variant="danger" onClick={handleLeave} className="flex-1 min-w-[120px]">
            Leave
          </Button>
        </div>

        {room.players.length < 2 && (
          <div className="text-center text-cream-dark/40 p-4 bg-surface-card/30 rounded-lg font-ancient italic border border-brass/10">
            Waiting for players...
          </div>
        )}
      </div>
    </motion.section>
  );
}

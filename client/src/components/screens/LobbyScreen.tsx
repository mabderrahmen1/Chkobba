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

  // Calculate positions around the table
  const maxSeats = room.maxPlayers;
  const seats = Array.from({ length: maxSeats }, (_, i) => {
    const player = room.players[i] || null;
    // Distribute evenly around the circle, starting from top
    const angle = (i * 360) / maxSeats - 90;
    const rad = (angle * Math.PI) / 180;
    return { player, angle, rad };
  });

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

      <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-8 max-w-2xl w-full py-4 sm:py-8 relative z-10 items-center">
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

        {/* Round Table */}
        <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px]">
          {/* Table surface */}
          <div
            className="absolute inset-[40px] sm:inset-[50px] rounded-full border-4 sm:border-[6px] border-amber-900/80"
            style={{
              background: 'radial-gradient(circle, #3a6b35 0%, #2d5429 60%, #1e3a1c 100%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.6), 0 0 0 2px rgba(139,90,43,0.3)',
            }}
          >
            {/* Felt texture */}
            <div className="absolute inset-0 rounded-full opacity-20" style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.1), transparent 50%)'
            }} />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-cream/30 font-ancient text-[8px] sm:text-[10px] uppercase tracking-widest">Chkobba</span>
              <span className="text-cream/20 font-ancient text-[7px] sm:text-[9px] mt-0.5">
                {room.players.length}/{maxSeats}
              </span>
            </div>
          </div>

          {/* Player seats around the table */}
          {seats.map((seat, i) => {
            const radius = 95; // px from center on mobile
            const smRadius = 125;
            const x = Math.cos(seat.rad) * radius;
            const y = Math.sin(seat.rad) * radius;
            const smX = Math.cos(seat.rad) * smRadius;
            const smY = Math.sin(seat.rad) * smRadius;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                }}
              >
                {/* Use responsive positioning */}
                <div
                  className="hidden sm:block absolute"
                  style={{ transform: `translate(calc(${smX}px - 50%), calc(${smY}px - 50%))` }}
                >
                  <SeatContent seat={seat} playerId={playerId} />
                </div>
                <div
                  className="sm:hidden absolute"
                  style={{ transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))` }}
                >
                  <SeatContent seat={seat} playerId={playerId} small />
                </div>
              </motion.div>
            );
          })}
        </div>

        {room.players.length < 2 && (
          <div className="text-center text-cream-dark/40 p-3 bg-surface-card/30 rounded-lg font-ancient italic border border-brass/10 text-sm">
            Waiting for players to join...
          </div>
        )}

        <div className="flex gap-2 sm:gap-3 flex-wrap w-full max-w-sm">
          <Button size="sm" onClick={handleReady} disabled={isReady} className="flex-1 min-w-[90px]">
            {isReady ? '\u2713 Ready' : 'Ready'}
          </Button>
          {isHost && room.players.length >= 2 && (
            <Button size="sm" variant="success" onClick={handleStart} className="flex-1 min-w-[90px]">
              Start Game
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={handleLeave} className="flex-1 min-w-[90px]">
            Leave
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function SeatContent({ seat, playerId, small }: { seat: { player: any; angle: number; rad: number }; playerId: string | null; small?: boolean }) {
  const { player } = seat;

  if (!player) {
    return (
      <div className={`${small ? 'w-10 h-10' : 'w-14 h-14 sm:w-16 sm:h-16'} rounded-full border-2 border-dashed border-brass/15 flex items-center justify-center bg-surface-card/20 backdrop-blur-sm`}>
        <span className={`text-cream-dark/20 ${small ? 'text-sm' : 'text-base sm:text-lg'}`}>?</span>
      </div>
    );
  }

  const isMe = player.id === playerId;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`relative ${small ? 'w-10 h-10 border-2' : 'w-14 h-14 sm:w-16 sm:h-16 border-[3px]'} rounded-full flex items-center justify-center transition-all ${
          isMe
            ? 'border-brass/70 bg-brass/15 shadow-glow-gold'
            : player.isReady
              ? 'border-green-500/50 bg-green-900/20'
              : 'border-cream-dark/20 bg-surface-card/40'
        } ${!player.isConnected ? 'opacity-40' : ''}`}
      >
        <span className={`font-ancient font-bold ${small ? 'text-sm' : 'text-base sm:text-lg'} ${
          isMe ? 'text-brass' : 'text-cream'
        }`}>
          {player.nickname.charAt(0).toUpperCase()}
        </span>

        {player.isReady && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -bottom-0.5 right-0 ${small ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} rounded-full bg-green-500 border-[1.5px] border-surface-alt flex items-center justify-center`}
          >
            <span className={`text-white ${small ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'} font-bold`}>{'\u2713'}</span>
          </motion.div>
        )}

        {player.isHost && (
          <div className={`absolute ${small ? '-top-1.5 text-[9px]' : '-top-2 text-[10px] sm:text-xs'} left-1/2 -translate-x-1/2`}>
            <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>&#9813;</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <span className={`font-ancient font-medium truncate text-center ${
          small ? 'text-[8px] max-w-[50px]' : 'text-[9px] sm:text-[10px] max-w-[60px] sm:max-w-[75px]'
        } ${isMe ? 'text-brass' : 'text-cream/80'}`}>
          {player.nickname}
          {isMe && ' (You)'}
        </span>
        <Badge variant={player.team === 0 ? 'team0' : 'team1'}>
          <span className={`${small ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'}`}>T{player.team + 1}</span>
        </Badge>
      </div>
    </div>
  );
}

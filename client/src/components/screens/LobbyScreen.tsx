import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useState, useEffect } from 'react';
import type { GameType } from '@shared/rules.js';

export function LobbyScreen() {
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = room?.hostId === playerId;
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);
  const reset = useGameStore((s) => s.reset);

  const [settings, setSettings] = useState({
    maxPlayers: room?.maxPlayers || 2,
    gameType: (room?.gameType || 'chkobba') as GameType,
    targetScore: room?.targetScore || 21,
  });

  useEffect(() => {
    if (room) {
      setSettings({
        maxPlayers: room.maxPlayers,
        gameType: room.gameType,
        targetScore: room.targetScore,
      });
    }
  }, [room?.id, room?.maxPlayers, room?.gameType, room?.targetScore]);

  if (!room || !playerId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#1a120e]">
        <div className="w-12 h-12 border-4 border-brass border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-brass font-ancient animate-pulse uppercase tracking-widest">Loading Lobby...</p>
      </div>
    );
  }

  const currentPlayer = room.players.find((p) => p.id === playerId);
  if (!currentPlayer) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#1a120e]">
        <div className="w-12 h-12 border-4 border-brass border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-brass font-ancient animate-pulse uppercase tracking-widest">Identifying Player...</p>
      </div>
    );
  }

  const isReady = currentPlayer.isReady;

  const handleCopy = () => {
    navigator.clipboard?.writeText(room.id)
      .then(() => addToast('Room code copied!', 'success'))
      .catch(() => addToast('Failed to copy', 'error'));
  };

  const handleReady = () => socket.emit('player_ready');
  const handleStart = () => socket.emit('start_game');
  const handleLeave = () => {
    socket.emit('leave_room');
    reset();
    setScreen('landing');
    sessionStorage.removeItem('chkobba-storage');
  };

  const handleUpdateSettings = () => {
    socket.emit('update_room_settings', settings);
    addToast('Settings updated', 'success');
  };

  const maxSeats = room.maxPlayers;
  const seats = Array.from({ length: maxSeats }, (_, i) => {
    const player = room.players[i] || null;
    const angle = (i * 360) / maxSeats - 90;
    const rad = (angle * Math.PI) / 180;
    return { player, angle, rad };
  });

  // Responsive seat radius
  const smRadius = 120;
  const lgRadius = 160;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex items-center justify-center overflow-y-auto relative bg-black"
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 grayscale-[10%]"
        style={{ backgroundImage: "url('/tun1.jpg')" }}
      />
      <div className="absolute inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(26,18,14,0.7) 0%, rgba(26,18,14,1) 90%)'
      }} />

      <div className="flex flex-col gap-4 sm:gap-5 px-4 sm:px-8 max-w-3xl w-full py-4 sm:py-8 relative z-10 items-center">
        {/* Room code */}
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-ancient font-bold text-brass mb-3">Lobby</h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-cream-dark/60 font-ancient text-sm">Room:</span>
            <span className="font-mono text-xl sm:text-2xl tracking-widest bg-surface-card px-4 py-2 rounded-lg text-brass border border-brass/20">
              {room.id}
            </span>
            <Button size="sm" variant="secondary" onClick={handleCopy}>Copy</Button>
          </div>
        </div>

        {/* Table with settings and seats */}
        <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] my-2">
          {/* Felt surface */}
          <div
            className="absolute inset-[40px] sm:inset-[44px] rounded-full border-4 sm:border-[7px] border-amber-900/80"
            style={{
              background: 'radial-gradient(circle, #3a6b35 0%, #2d5429 60%, #1e3a1c 100%)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.6)',
            }}
          >
            {/* Settings ON the table */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 px-3">
              {isHost ? (
                <>
                  {/* Game type toggle */}
                  <div className="flex rounded overflow-hidden border border-brass/25 w-full max-w-[160px] sm:max-w-[180px]">
                    <button
                      onClick={() => { setSettings(s => ({ ...s, gameType: 'chkobba' })); }}
                      className={`flex-1 py-1 sm:py-1.5 font-ancient text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
                        settings.gameType === 'chkobba'
                          ? 'bg-brass/80 text-black'
                          : 'bg-black/30 text-cream/20'
                      }`}
                    >Chkobba</button>
                    <button
                      onClick={() => { setSettings(s => ({ ...s, gameType: 'rummy' })); }}
                      className={`flex-1 py-1 sm:py-1.5 font-ancient text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
                        settings.gameType === 'rummy'
                          ? 'bg-brass/80 text-black'
                          : 'bg-black/30 text-cream/20'
                      }`}
                    >Rummy</button>
                  </div>

                  {/* Score chips */}
                  <div className="flex gap-1.5 sm:gap-2">
                    {[11, 21, 31].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSettings(st => ({ ...st, targetScore: s }))}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full font-ancient font-bold text-[10px] sm:text-xs border transition-all ${
                          settings.targetScore === s
                            ? 'bg-brass/80 text-black border-brass scale-110'
                            : 'bg-black/25 text-cream/30 border-brass/15'
                        }`}
                      >{s}</button>
                    ))}
                  </div>

                  {/* Player count */}
                  <div className="flex rounded overflow-hidden border border-brass/25 w-full max-w-[120px] sm:max-w-[140px]">
                    <button
                      onClick={() => setSettings(s => ({ ...s, maxPlayers: 2 }))}
                      className={`flex-1 py-1 font-ancient text-[8px] sm:text-[9px] font-bold tracking-wider transition-all ${
                        settings.maxPlayers === 2
                          ? 'bg-brass/80 text-black'
                          : 'bg-black/30 text-cream/20'
                      }`}
                    >1v1</button>
                    <button
                      onClick={() => setSettings(s => ({ ...s, maxPlayers: 4 }))}
                      className={`flex-1 py-1 font-ancient text-[8px] sm:text-[9px] font-bold tracking-wider transition-all ${
                        settings.maxPlayers === 4
                          ? 'bg-brass/80 text-black'
                          : 'bg-black/30 text-cream/20'
                      }`}
                    >2v2</button>
                  </div>

                  <button
                    onClick={handleUpdateSettings}
                    className="mt-0.5 text-[8px] sm:text-[9px] text-brass/50 font-ancient uppercase tracking-widest hover:text-brass transition-colors"
                  >
                    Update
                  </button>
                </>
              ) : (
                <>
                  <span className="text-cream/40 font-ancient text-[10px] sm:text-xs uppercase tracking-widest">{room.gameType}</span>
                  <span className="text-cream/25 font-ancient text-[9px] sm:text-[10px]">Target: {room.targetScore}</span>
                  <span className="text-cream/20 font-ancient text-[8px] sm:text-[9px]">
                    {room.players.length}/{maxSeats} players
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Seats around the table */}
          {seats.map((seat, i) => {
            const rad = seat.rad;
            const sx = Math.cos(rad) * smRadius;
            const sy = Math.sin(rad) * smRadius;
            const lx = Math.cos(rad) * lgRadius;
            const ly = Math.sin(rad) * lgRadius;

            return (
              <div key={i} className="absolute left-1/2 top-1/2">
                <div className="hidden sm:block absolute" style={{ transform: `translate(calc(${lx}px - 50%), calc(${ly}px - 50%))` }}>
                  <SeatContent seat={seat} playerId={playerId} />
                </div>
                <div className="sm:hidden absolute" style={{ transform: `translate(calc(${sx}px - 50%), calc(${sy}px - 50%))` }}>
                  <SeatContent seat={seat} playerId={playerId} small />
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 sm:gap-3 flex-wrap w-full max-w-sm mt-2">
          <Button size="sm" onClick={handleReady} disabled={isReady} className="flex-1 min-w-[90px]">
            {isReady ? '✓ Ready' : 'Ready'}
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

function SeatContent({ seat, playerId, small }: any) {
  const { player } = seat;
  if (!player) return (
    <div className={`${small ? 'w-10 h-10' : 'w-14 h-14 sm:w-16 sm:h-16'} rounded-full border-2 border-dashed border-brass/15 flex items-center justify-center bg-surface-card/20`}>
      <span className="text-cream-dark/20">?</span>
    </div>
  );

  const isMe = player.id === playerId;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`relative ${small ? 'w-10 h-10 border-2' : 'w-14 h-14 sm:w-16 sm:h-16 border-[3px]'} rounded-full flex items-center justify-center ${
          isMe ? 'border-brass bg-brass/15 shadow-glow-gold' : player.isReady ? 'border-green-500/50 bg-green-900/20' : 'border-cream-dark/20 bg-surface-card/40'
        } ${!player.isConnected ? 'opacity-40' : ''}`}
      >
        <span className="font-ancient font-bold text-cream">{player.nickname.charAt(0).toUpperCase()}</span>
        {player.isHost && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-brass text-xs">👑</div>
        )}
      </div>
      <span className="text-[9px] text-cream/80 font-ancient">{player.nickname}</span>
      <Badge variant={player.team === 0 ? 'team0' : 'team1'}><span className="text-[7px]">T{player.team + 1}</span></Badge>
    </div>
  );
}

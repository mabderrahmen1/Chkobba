import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { useState, useEffect } from 'react';
import type { GameType } from '@shared/rules.js';

export function LobbyScreen() {
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = room?.hostId === playerId; // React directly to room hostId
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);
  const reset = useGameStore((s) => s.reset);

  const [settings, setSettings] = useState({
    maxPlayers: room?.maxPlayers || 2,
    gameType: (room?.gameType || 'chkobba') as GameType,
    targetScore: room?.targetScore || 21
  });

  // Sync settings when room updates from server
  useEffect(() => {
    if (room) {
      setSettings({
        maxPlayers: room.maxPlayers,
        gameType: room.gameType,
        targetScore: room.targetScore
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
    console.warn('[Lobby] Player not found in room players list');
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

  // Calculate positions around the table
  const maxSeats = room.maxPlayers;
  const seats = Array.from({ length: maxSeats }, (_, i) => {
    const player = room.players[i] || null;
    const angle = (i * 360) / maxSeats - 90;
    const rad = (angle * Math.PI) / 180;
    return { player, angle, rad };
  });

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex items-center justify-center overflow-y-auto relative bg-[#1a120e]"
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

        {/* Host Settings - Matches Create Room UI */}
        {isHost && (
          <div className="w-full max-w-sm p-5 bg-black/40 border border-brass/20 rounded-xl space-y-4 shadow-2xl backdrop-blur-md">
            <div className="text-[10px] text-brass font-ancient uppercase tracking-[0.3em] text-center border-b border-brass/10 pb-2 mb-2">
              Room Configuration
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-cream/40 uppercase font-ancient ml-1">Game Type</label>
                <Select 
                  value={settings.gameType} 
                  onChange={(e) => setSettings(s => ({ ...s, gameType: e.target.value as GameType }))}
                >
                  <option value="chkobba">Chkobba</option>
                  <option value="rummy">Rummy</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-cream/40 uppercase font-ancient ml-1">Target Score</label>
                  <Select 
                    value={settings.targetScore} 
                    onChange={(e) => setSettings(s => ({ ...s, targetScore: Number(e.target.value) }))}
                  >
                    <option value={11}>11 Pts</option>
                    <option value={21}>21 Pts</option>
                    <option value={31}>31 Pts</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-cream/40 uppercase font-ancient ml-1">Max Players</label>
                  <Select 
                    value={settings.maxPlayers} 
                    onChange={(e) => setSettings(s => ({ ...s, maxPlayers: Number(e.target.value) }))}
                  >
                    <option value={2}>1 vs 1</option>
                    <option value={4}>2 vs 2</option>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button size="sm" className="w-full mt-2 py-3" onClick={handleUpdateSettings}>Update Settings</Button>
          </div>
        )}

        {!isHost && (
          <div className="text-center text-cream-dark/50 flex justify-center gap-4 flex-wrap font-ancient text-sm">
            <span className="bg-brass/5 px-3 py-1 rounded border border-brass/10">{room.gameType.toUpperCase()}</span>
            <span className="bg-brass/5 px-3 py-1 rounded border border-brass/10">{room.maxPlayers} PLAYERS</span>
            <span className="bg-brass/5 px-3 py-1 rounded border border-brass/10">TARGET: {room.targetScore}</span>
          </div>
        )}

        {/* Round Table Visual */}
        <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] my-4">
          <div className="absolute inset-[40px] sm:inset-[50px] rounded-full border-4 sm:border-[6px] border-amber-900/80"
            style={{
              background: 'radial-gradient(circle, #3a6b35 0%, #2d5429 60%, #1e3a1c 100%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.6)',
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-cream/30 font-ancient text-[8px] sm:text-[10px] uppercase tracking-widest">{room.gameType}</span>
              <span className="text-cream/20 font-ancient text-[7px] sm:text-[9px] mt-0.5">
                {room.players.length}/{maxSeats}
              </span>
            </div>
          </div>

          {seats.map((seat, i) => {
            const rad = seat.rad;
            const x = Math.cos(rad) * 95;
            const y = Math.sin(rad) * 95;
            const smX = Math.cos(rad) * 125;
            const smY = Math.sin(rad) * 125;

            return (
              <div key={i} className="absolute left-1/2 top-1/2">
                <div className="hidden sm:block absolute" style={{ transform: `translate(calc(${smX}px - 50%), calc(${smY}px - 50%))` }}>
                  <SeatContent seat={seat} playerId={playerId} />
                </div>
                <div className="sm:hidden absolute" style={{ transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))` }}>
                  <SeatContent seat={seat} playerId={playerId} small />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 sm:gap-3 flex-wrap w-full max-w-sm mt-4">
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
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-brass">👑</div>
        )}
      </div>
      <span className="text-[9px] text-cream/80 font-ancient">{player.nickname}</span>
      <Badge variant={player.team === 0 ? 'team0' : 'team1'}><span className="text-[7px]">T{player.team + 1}</span></Badge>
    </div>
  );
}

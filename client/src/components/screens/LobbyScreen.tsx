import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { useState, useEffect, type ReactNode } from 'react';
import type { GameType } from '@shared/rules.js';

/* ─── person silhouette SVG ─── */
function PersonIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="7" r="4" />
      <path d="M12 13c-5 0-8 2.5-8 5v2h16v-2c0-2.5-3-5-8-5z" />
    </svg>
  );
}

/* ─── robot icon for bots ─── */
function BotIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="7" y="8" width="10" height="9" rx="2" />
      <rect x="9" y="10" width="2" height="2" rx="0.5" className="fill-current opacity-60" style={{ fill: 'currentColor', opacity: 0.4 }} />
      <rect x="13" y="10" width="2" height="2" rx="0.5" style={{ fill: 'currentColor', opacity: 0.4 }} />
      <rect x="10" y="13" width="4" height="1.5" rx="0.75" style={{ fill: 'currentColor', opacity: 0.4 }} />
      <rect x="11" y="5" width="2" height="3" rx="1" />
      <circle cx="12" cy="4.5" r="1.2" />
      <rect x="5" y="10" width="2" height="4" rx="1" />
      <rect x="17" y="10" width="2" height="4" rx="1" />
      <rect x="9" y="17" width="2" height="2" rx="1" />
      <rect x="13" y="17" width="2" height="2" rx="1" />
    </svg>
  );
}

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
    turnTimeout: room?.turnTimeout ?? 60,
  });

  const [settingsDirty, setSettingsDirty] = useState(false);

  useEffect(() => {
    if (room) {
      setSettings({
        maxPlayers: room.maxPlayers,
        gameType: room.gameType,
        targetScore: room.targetScore,
        turnTimeout: room.turnTimeout ?? 60,
      });
      setSettingsDirty(false);
    }
  }, [room?.id, room?.maxPlayers, room?.gameType, room?.targetScore, room?.turnTimeout]);

  // Reverting to the familiar early return pattern
  if (!room || !playerId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#1a120e]">
        <div className="w-12 h-12 border-4 border-brass border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-brass font-ancient animate-pulse uppercase tracking-widest">Loading Lobby...</p>
      </div>
    );
  }

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isReady = currentPlayer?.isReady ?? false;

  const handleCopy = () => {
    navigator.clipboard?.writeText(room.id)
      .then(() => addToast('Room code copied!', 'success'))
      .catch(() => addToast('Failed to copy', 'error'));
  };

  const handleReady = () => socket.emit('player_ready');
  const handleStart = () => socket.emit('start_game');
  const handleAddBot = () => socket.emit('add_bot');
  
  const handleLeave = () => {
    // 1. Notify server
    socket.emit('leave_room');
    
    // 2. Clear submitting state so landing buttons are ready
    useUIStore.getState().setIsSubmitting(false);
    
    // 3. Move to landing first while data still exists for the exit animation
    useUIStore.getState().setScreen('landing');
    
    // 4. Clear local session storage
    sessionStorage.removeItem('chkobba-storage');
    
    // 5. Wipe internal state after a delay to allow navigation to start
    setTimeout(() => {
      useGameStore.getState().reset();
    }, 500);
  };

  const updateSetting = (patch: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    socket.emit('update_room_settings', newSettings);
  };

  const handleGameTypeChange = (type: GameType) => {
    if (type === 'rummy') {
      updateSetting({ gameType: type, maxPlayers: Math.min(settings.maxPlayers, 4), targetScore: 0 });
    } else {
      updateSetting({ gameType: type, maxPlayers: settings.maxPlayers <= 4 ? settings.maxPlayers : 2, targetScore: 21 });
    }
  };

  const maxSeats = room.maxPlayers;

  // Helper to get seat player by index (0 = me/bottom, then clockwise)
  const seat = (i: number) => room.players[i] || null;
  const isMe = (i: number) => room.players[i]?.id === playerId;

  /* The felt table inner content — shared between 2/3/4-player layouts */
  const TableFelt = () => (
    <div
      className="relative rounded-[32px] sm:rounded-[40px] border-[2px] sm:border-[4px] border-brass/20 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(58, 107, 53, 0.95) 0%, rgba(45, 84, 41, 0.98) 60%, rgba(30, 58, 28, 1) 100%)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.8)',
        minHeight: '340px',
        minWidth: '320px',
      }}
    >
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
      }} />
      <div className="absolute inset-0 rounded-[30px] sm:rounded-[36px] pointer-events-none border border-white/10" />

      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-8 gap-6 sm:gap-8 h-full">
        {isHost ? (
          <>
            <div className="w-full max-w-[280px]">
              <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                Game Mode
              </div>
              <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner-dark">
                {(['chkobba', 'rummy'] as GameType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleGameTypeChange(type)}
                    className={`flex-1 py-2 sm:py-3 font-ancient text-sm sm:text-base font-bold uppercase tracking-widest transition-all duration-300 rounded-lg ${
                      settings.gameType === type
                        ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                        : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                    }`}
                  >
                    {type === 'chkobba' ? 'Chkobba' : 'Rummy'}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {settings.gameType === 'chkobba' && (
                <motion.div
                  key="target-score"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-[280px]"
                >
                  <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                    Target Score
                  </div>
                  <div className="flex justify-center gap-4 sm:gap-5">
                    {[11, 21, 31].map((s) => (
                      <motion.button
                        key={s}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSetting({ targetScore: s })}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-ancient font-bold text-sm sm:text-base border-2 transition-all duration-300 ${
                          settings.targetScore === s
                            ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                            : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                        }`}
                      >{s}</motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-[280px]">
              <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                Players
              </div>
              {settings.gameType === 'chkobba' ? (
                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 max-w-[220px] mx-auto shadow-inner-dark">
                  {[{ n: 2, label: '1 vs 1' }, { n: 4, label: '2 vs 2' }].map(({ n, label }) => (
                    <button
                      key={n}
                      onClick={() => updateSetting({ maxPlayers: n })}
                      className={`flex-1 py-1.5 sm:py-2.5 font-ancient text-xs sm:text-sm font-bold tracking-widest transition-all duration-300 rounded-lg ${
                        settings.maxPlayers === n
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                          : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center gap-3 sm:gap-4">
                  {[2, 3, 4].map((n) => (
                    <motion.button
                      key={n}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateSetting({ maxPlayers: n })}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-ancient font-bold text-sm sm:text-base border-2 transition-all duration-300 ${
                        settings.maxPlayers === n
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                          : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                      }`}
                    >{n}</motion.button>
                  ))}
                </div>
              )}
            </div>

            {settings.gameType === 'chkobba' && (
              <div className="w-full max-w-[280px]">
                <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                  Turn Timeout
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  {[{ v: 0, label: 'Off' }, { v: 30, label: '30s' }, { v: 60, label: '60s' }, { v: 90, label: '90s' }, { v: 120, label: '2m' }].map(({ v, label }) => (
                    <motion.button
                      key={v}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateSetting({ turnTimeout: v })}
                      className={`px-3 py-1.5 rounded-lg font-ancient font-bold text-[10px] sm:text-[11px] border transition-all duration-300 ${
                        settings.turnTimeout === v
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                          : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-white/5 shadow-inner-dark'
                      }`}
                    >{label}</motion.button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-brass-light to-brass-dark font-ancient text-xl sm:text-2xl uppercase tracking-[0.3em] font-extrabold drop-shadow-md">
              {room.gameType === 'chkobba' ? 'Chkobba' : 'Rummy'}
            </span>
            {room.gameType === 'chkobba' && (
              <span className="text-cream/60 font-ancient text-sm tracking-widest bg-black/40 px-4 py-1 rounded-full border border-white/5">
                Target: {room.targetScore} pts
              </span>
            )}
            <span className="text-cream/40 font-ancient text-xs uppercase tracking-widest mt-2">
              {room.players.length}/{maxSeats} players joined
            </span>
            <span className="text-cream/30 font-ancient text-[10px] italic mt-4 animate-pulse">
              Waiting for host to start...
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="h-full relative overflow-y-auto overflow-x-hidden bg-transparent flex flex-col"
    >
      {/* Cinematic Background (Provided by App.tsx) */}
      <div className="fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(26,18,14,0.7) 0%, rgba(26,18,14,1) 90%)'
      }} />

      <div className="flex flex-col gap-4 sm:gap-5 px-3 sm:px-6 max-w-5xl w-full py-8 sm:py-12 relative z-10 items-center my-auto mx-auto flex-shrink-0">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h2 className="text-xl sm:text-2xl font-ancient font-bold text-brass mb-2 uppercase tracking-widest">Lobby</h2>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-cream-dark/50 font-ancient text-xs">Room Code</span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopy}
              className="font-mono text-lg sm:text-xl tracking-[0.3em] bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-lg text-brass border border-brass/25 hover:border-brass/50 transition-colors cursor-pointer flex items-center gap-2"
            >
              {room.id}
              <svg className="w-3.5 h-3.5 text-brass/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          className="w-full max-w-[900px] mx-auto"
        >
          {maxSeats === 4 ? (
            <div className="flex flex-col items-center gap-6">
              <AnimSeat i={2} delay={0.28}><SeatCard player={seat(2)} isMe={isMe(2)} isHost={isHost} /></AnimSeat>
              <div className="flex items-center gap-6 w-full">
                <div className="flex-none">
                  <AnimSeat i={3} delay={0.32}><SeatCard player={seat(3)} isMe={isMe(3)} isHost={isHost} /></AnimSeat>
                </div>
                <div className="flex-1">
                  <TableFelt />
                </div>
                <div className="flex-none">
                  <AnimSeat i={1} delay={0.36}><SeatCard player={seat(1)} isMe={isMe(1)} isHost={isHost} /></AnimSeat>
                </div>
              </div>
              <AnimSeat i={0} delay={0.40}><SeatCard player={seat(0)} isMe={isMe(0)} isHost={isHost} /></AnimSeat>
            </div>
          ) : maxSeats === 3 ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-end justify-center gap-20">
                <AnimSeat i={1} delay={0.28}><SeatCard player={seat(1)} isMe={isMe(1)} isHost={isHost} /></AnimSeat>
                <AnimSeat i={2} delay={0.32}><SeatCard player={seat(2)} isMe={isMe(2)} isHost={isHost} /></AnimSeat>
              </div>
              <div className="w-full max-w-[500px]">
                <TableFelt />
              </div>
              <AnimSeat i={0} delay={0.36}><SeatCard player={seat(0)} isMe={isMe(0)} isHost={isHost} /></AnimSeat>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <AnimSeat i={1} delay={0.28}><SeatCard player={seat(1)} isMe={isMe(1)} isHost={isHost} /></AnimSeat>
              <div className="w-full max-w-[500px]">
                <TableFelt />
              </div>
              <AnimSeat i={0} delay={0.36}><SeatCard player={seat(0)} isMe={isMe(0)} isHost={isHost} /></AnimSeat>
            </div>
          )}
        </motion.div>

        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none flex justify-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex gap-4 sm:gap-6 flex-wrap w-full max-w-2xl justify-center pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-glass-panel"
          >
            <Button onClick={handleReady} disabled={isReady} className="flex-1 min-w-[120px] max-w-[200px]" size="lg">
              {isReady ? 'Ready ✓' : 'Ready Up'}
            </Button>
            {isHost && room.players.length < room.maxPlayers && (
              <Button variant="secondary" onClick={handleAddBot} className="flex-1 min-w-[120px] max-w-[200px]" size="lg">
                Add Bot
              </Button>
            )}
            {isHost && room.players.length === room.maxPlayers && (
              <Button variant="success" onClick={handleStart} className="flex-1 min-w-[120px] max-w-[200px]" size="lg">
                Start Game
              </Button>
            )}
            <Button variant="danger" onClick={handleLeave} className="flex-1 min-w-[120px] max-w-[200px]" size="lg">
              Leave
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

function AnimSeat({ i, delay, children }: { i: number; delay: number; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}

function SeatCard({ player, isMe, isHost }: { player: any | null; isMe: boolean; isHost: boolean }) {
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-30 grayscale-[50%]">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center">
          <PersonIcon size={24} className="text-white/20" />
        </div>
        <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5">
          <span className="text-[10px] sm:text-xs font-ancient uppercase tracking-widest text-white/20">Empty</span>
        </div>
      </div>
    );
  }

  const isBot = player.isBot;

  if (isBot) {
    return (
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2 relative">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-900/40 to-black/60 border-2 border-blue-500/30 flex items-center justify-center shadow-xl relative z-10">
            <BotIcon size={28} className="text-blue-400" />
          </div>
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20" />
          
          {/* Remove button (host only) */}
          {isHost && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => socket.emit('remove_bot', { botId: player.id })}
              className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-red-500 to-red-800 text-white flex items-center justify-center border border-red-300 shadow-lg z-30 transition-colors"
              title="Remove bot"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
        <div className="bg-black/60 backdrop-blur-sm border border-white/5 rounded-lg px-3 py-1 shadow-md">
          <span className="text-[10px] sm:text-xs font-ancient font-extrabold tracking-widest max-w-[80px] truncate block text-cream/60">
            {player.nickname}
          </span>
        </div>
        <span className={`text-[8px] sm:text-[9px] font-ancient uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg shadow-md ${
          player.team === 0 
            ? 'bg-gradient-to-r from-amber-800 to-amber-950 text-amber-500 font-extrabold border border-amber-800/50' 
            : 'bg-gradient-to-r from-teal-800 to-teal-950 text-teal-500 font-extrabold border border-teal-800/50'
        }`}>
          Team {player.team + 1}
        </span>
      </motion.div>
    );
  }

  const borderColor = isMe ? 'border-brass-light shadow-[0_0_20px_rgba(212,175,55,0.4)]' : player.isReady ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/10 shadow-inner-dark';
  const bgColor = isMe ? 'bg-gradient-to-br from-brass/20 to-black/60' : player.isReady ? 'bg-gradient-to-br from-emerald-900/30 to-black/60' : 'bg-black/50';

  return (
    <motion.div className="flex flex-col items-center gap-2 relative">
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 ${borderColor} ${bgColor} flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden group shadow-2xl`}>
        <div className="absolute inset-0 bg-glass-gradient pointer-events-none rounded-xl" />
        <PersonIcon size={24} className={`relative z-10 ${isMe ? 'text-brass-light drop-shadow-md' : player.isReady ? 'text-emerald-400 drop-shadow-md' : 'text-cream/30'} transition-colors duration-300 mb-1`} />
        {player.isReady && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border border-emerald-200 shadow-lg z-20">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>
      <div className="bg-black/60 backdrop-blur-sm border border-white/5 rounded-lg px-3 py-1 shadow-md">
        <span className={`text-[10px] sm:text-xs font-ancient font-extrabold tracking-widest max-w-[80px] truncate block ${isMe ? 'text-transparent bg-clip-text bg-gradient-to-r from-brass-light to-brass-dark' : 'text-cream/80'}`}>
          {player.nickname}
        </span>
      </div>
      <span className={`text-[8px] sm:text-[9px] font-ancient uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg shadow-md ${
        player.team === 0 ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-black font-extrabold border border-amber-500/50' : 'bg-gradient-to-r from-teal-600 to-teal-800 text-black font-extrabold border border-teal-500/50'
      }`}>
        Team {player.team + 1}
      </span>
    </motion.div>
  );
}

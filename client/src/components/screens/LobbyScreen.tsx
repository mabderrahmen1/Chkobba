import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';
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

  const updateSetting = (patch: Partial<typeof settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setSettingsDirty(true);
  };

  const handleUpdateSettings = () => {
    socket.emit('update_room_settings', settings);
    addToast('Settings updated', 'success');
    setSettingsDirty(false);
  };

  const handleGameTypeChange = (type: GameType) => {
    if (type === 'rummy') {
      updateSetting({ gameType: type, maxPlayers: Math.min(settings.maxPlayers, 4), targetScore: 0 });
    } else {
      updateSetting({ gameType: type, maxPlayers: settings.maxPlayers <= 4 ? settings.maxPlayers : 2, targetScore: 21 });
    }
  };

  const maxSeats = room.maxPlayers;

  /* Seat positions around a rectangle.
     We place seats at: top-center, right-center, bottom-center, left-center
     for 2 players: bottom, top
     for 3 players: bottom, top-left, top-right
     for 4 players: bottom, right, top, left */
  const seatPositions: { x: string; y: string; label: string }[] =
    maxSeats === 2
      ? [
          { x: '50%', y: '100%', label: 'bottom' },
          { x: '50%', y: '0%', label: 'top' },
        ]
      : maxSeats === 3
        ? [
            { x: '50%', y: '100%', label: 'bottom' },
            { x: '15%', y: '0%', label: 'top-left' },
            { x: '85%', y: '0%', label: 'top-right' },
          ]
        : [
            { x: '50%', y: '100%', label: 'bottom' },
            { x: '100%', y: '50%', label: 'right' },
            { x: '50%', y: '0%', label: 'top' },
            { x: '0%', y: '50%', label: 'left' },
          ];

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

      <div className="flex flex-col gap-5 sm:gap-6 px-3 sm:px-6 max-w-4xl w-full py-4 sm:py-6 relative z-10 items-center">

        {/* Room code header */}
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

        {/* Rectangular table with seats */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          className="relative w-full max-w-[600px] mx-auto"
          style={{ paddingTop: '36px', paddingBottom: '56px', paddingLeft: '44px', paddingRight: '44px' }}
        >
          {/* The felt table */}
          <div
            className="relative rounded-2xl sm:rounded-3xl border-[5px] sm:border-[7px] border-amber-900/80 overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, #3a6b35 0%, #2d5429 50%, #1e3a1c 100%)',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.6)',
              minHeight: '240px',
            }}
          >
            {/* Subtle felt texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            }} />

            {/* Inner light rim */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)' }} />

            {/* Settings content on the table */}
            <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-8 gap-4 sm:gap-5">
              {isHost ? (
                <>
                  {/* Game type toggle */}
                  <div className="w-full max-w-[240px]">
                    <div className="text-cream/25 font-ancient text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-center mb-2">
                      Game Mode
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-brass/30">
                      {(['chkobba', 'rummy'] as GameType[]).map((type) => (
                        <motion.button
                          key={type}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleGameTypeChange(type)}
                          className={`flex-1 py-2 sm:py-2.5 font-ancient text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                            settings.gameType === type
                              ? 'bg-brass/85 text-black'
                              : 'bg-black/30 text-cream/20 hover:text-cream/35'
                          }`}
                        >
                          {type === 'chkobba' ? 'Chkobba' : 'Rummy'}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Target score (Chkobba only) */}
                  <AnimatePresence mode="wait">
                    {settings.gameType === 'chkobba' && (
                      <motion.div
                        key="target-score"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-[240px]"
                      >
                        <div className="text-cream/25 font-ancient text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-center mb-2">
                          Target Score
                        </div>
                        <div className="flex justify-center gap-2 sm:gap-3">
                          {[11, 21, 31].map((s) => (
                            <motion.button
                              key={s}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateSetting({ targetScore: s })}
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-ancient font-bold text-xs sm:text-sm border-2 transition-all duration-200 ${
                                settings.targetScore === s
                                  ? 'bg-brass/85 text-black border-brass shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-110'
                                  : 'bg-black/25 text-cream/30 border-brass/15 hover:border-brass/30'
                              }`}
                            >{s}</motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Player count */}
                  <div className="w-full max-w-[240px]">
                    <div className="text-cream/25 font-ancient text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-center mb-2">
                      Players
                    </div>
                    {settings.gameType === 'chkobba' ? (
                      <div className="flex rounded-lg overflow-hidden border border-brass/30 max-w-[180px] mx-auto">
                        {[{ n: 2, label: '1 vs 1' }, { n: 4, label: '2 vs 2' }].map(({ n, label }) => (
                          <motion.button
                            key={n}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => updateSetting({ maxPlayers: n })}
                            className={`flex-1 py-1.5 sm:py-2 font-ancient text-[10px] sm:text-xs font-bold tracking-wider transition-all duration-200 ${
                              settings.maxPlayers === n
                                ? 'bg-brass/85 text-black'
                                : 'bg-black/30 text-cream/20 hover:text-cream/35'
                            }`}
                          >{label}</motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {[2, 3, 4].map((n) => (
                          <motion.button
                            key={n}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateSetting({ maxPlayers: n })}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-ancient font-bold text-xs sm:text-sm border-2 transition-all duration-200 ${
                              settings.maxPlayers === n
                                ? 'bg-brass/85 text-black border-brass shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-110'
                                : 'bg-black/25 text-cream/30 border-brass/15 hover:border-brass/30'
                            }`}
                          >{n}</motion.button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Turn Timeout (Chkobba only) */}
                  {settings.gameType === 'chkobba' && (
                    <div className="w-full max-w-[240px]">
                      <div className="text-cream/25 font-ancient text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-center mb-2">
                        Turn Timeout
                      </div>
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {[{ v: 0, label: 'Off' }, { v: 30, label: '30s' }, { v: 60, label: '60s' }, { v: 90, label: '90s' }, { v: 120, label: '2m' }].map(({ v, label }) => (
                          <motion.button
                            key={v}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateSetting({ turnTimeout: v })}
                            className={`px-2 py-1 rounded font-ancient font-bold text-[9px] sm:text-[10px] border transition-all duration-200 ${
                              settings.turnTimeout === v
                                ? 'bg-brass/85 text-black border-brass'
                                : 'bg-black/25 text-cream/30 border-brass/15 hover:border-brass/30'
                            }`}
                          >{label}</motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Apply settings button */}
                  <AnimatePresence>
                    {settingsDirty && (
                      <motion.button
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        onClick={handleUpdateSettings}
                        className="text-[9px] sm:text-[10px] text-black bg-brass/80 hover:bg-brass font-ancient uppercase tracking-[0.25em] px-4 py-1.5 rounded-full transition-colors font-bold"
                      >
                        Apply Changes
                      </motion.button>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                /* Non-host: read-only view */
                <div className="flex flex-col items-center gap-2 py-2">
                  <span className="text-brass/70 font-ancient text-sm sm:text-base uppercase tracking-[0.2em] font-bold">
                    {room.gameType === 'chkobba' ? 'Chkobba' : 'Rummy'}
                  </span>
                  {room.gameType === 'chkobba' && (
                    <span className="text-cream/30 font-ancient text-xs">
                      Target: {room.targetScore} pts
                    </span>
                  )}
                  <span className="text-cream/20 font-ancient text-[10px] uppercase tracking-widest">
                    {room.players.length}/{maxSeats} players
                  </span>
                  <span className="text-cream/15 font-ancient text-[9px] italic mt-1">
                    Waiting for host...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seats around the table */}
          {seatPositions.map((pos, i) => {
            const player = room.players[i] || null;
            const isMe = player?.id === playerId;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 200 }}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <SeatCard player={player} isMe={isMe} />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2 sm:gap-3 flex-wrap w-full max-w-md justify-center"
        >
          <Button size="sm" onClick={handleReady} disabled={isReady} className="flex-1 min-w-[100px] max-w-[150px]">
            {isReady ? 'Ready' : 'Ready Up'}
          </Button>
          {isHost && room.players.length >= 2 && (
            <Button size="sm" variant="success" onClick={handleStart} className="flex-1 min-w-[100px] max-w-[150px]">
              Start Game
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={handleLeave} className="flex-1 min-w-[100px] max-w-[150px]">
            Leave
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ─── Seat card: person / bot + name + status ─── */
function SeatCard({ player, isMe }: { player: any; isMe: boolean }) {
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = room?.hostId === playerId;
  const addToast = useUIStore((s) => s.addToast);

  // ── Empty seat ──
  if (!player) {
    return (
      <motion.div
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-dashed border-brass/15 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <PersonIcon size={22} className="text-cream-dark/15" />
        </div>
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => socket.emit('add_bot')}
            className="text-[7px] sm:text-[8px] text-brass/60 hover:text-brass font-ancient uppercase tracking-wider border border-brass/20 hover:border-brass/50 px-1.5 py-0.5 rounded transition-colors"
          >
            + Bot
          </motion.button>
        ) : (
          <span className="text-[8px] sm:text-[9px] text-cream-dark/20 font-ancient uppercase tracking-wider">
            Empty
          </span>
        )}
      </motion.div>
    );
  }

  // ── Bot seat ──
  if (player.isBot) {
    return (
      <motion.div layout className="flex flex-col items-center gap-1 relative">
        <div className="relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-brass/40 bg-brass/5 backdrop-blur-sm flex flex-col items-center justify-center">
          <BotIcon size={20} className="text-brass/70 mb-0.5" />
          {/* Bot badge */}
          <span className="text-[6px] font-ancient uppercase tracking-widest text-brass/50 px-1 py-0.5 rounded bg-brass/10 border border-brass/20 leading-none">
            BOT
          </span>
          {/* Remove button (host only) */}
          {isHost && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => socket.emit('remove_bot', { botId: player.id })}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-800/80 hover:bg-red-600 text-white flex items-center justify-center border border-red-500/60 shadow z-20 transition-colors"
              title="Remove bot"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
        <span className="text-[9px] sm:text-[10px] font-ancient font-bold tracking-wide max-w-[60px] truncate text-brass/60">
          {player.nickname}
        </span>
        <span className={`text-[7px] sm:text-[8px] font-ancient uppercase tracking-widest px-1.5 py-0.5 rounded ${
          player.team === 0 ? 'bg-amber-600/70 text-black font-bold' : 'bg-teal-600/70 text-black font-bold'
        }`}>
          Team {player.team + 1}
        </span>
      </motion.div>
    );
  }

  // ── Human seat ──
  const borderColor = isMe
    ? 'border-brass shadow-[0_0_16px_rgba(212,175,55,0.3)]'
    : player.isReady
      ? 'border-green-500/60'
      : 'border-cream-dark/25';

  const bgColor = isMe
    ? 'bg-brass/10'
    : player.isReady
      ? 'bg-green-900/15'
      : 'bg-black/30';

  const handleTeamSwitch = () => {
    if (!isHost || !room || room.gameType !== 'chkobba') return;
    if (room.maxPlayers === 2) {
      const newTeam = player.team === 0 ? 1 : 0;
      socket.emit('update_player_team', { playerId: player.id, team: newTeam });
    } else if (room.maxPlayers === 4) {
      const newTeam = player.team === 0 ? 1 : 0;
      const currentTeamCount = room.players.filter((p: any) => p.team === newTeam).length;
      if (currentTeamCount < 2) {
        socket.emit('update_player_team', { playerId: player.id, team: newTeam });
      } else {
        addToast('Team is full (max 2 players)', 'error');
      }
    }
  };

  return (
    <motion.div layout className="flex flex-col items-center gap-1 relative">
      {/* Crown for host */}
      {player.isHost && (
        <motion.div
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm z-10"
        >
          <span className="drop-shadow-lg">👑</span>
        </motion.div>
      )}

      {/* Person card */}
      <div
        className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 ${borderColor} ${bgColor} ${
          !player.isConnected ? 'opacity-40' : ''
        }`}
      >
        <PersonIcon
          size={20}
          className={`${
            isMe ? 'text-brass' : player.isReady ? 'text-green-400/80' : 'text-cream/40'
          } transition-colors duration-300 mb-0.5`}
        />

        {/* Ready check */}
        {player.isReady && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center border border-green-400"
          >
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}

        {/* Team switch button (host only, Chkobba games) */}
        {isHost && room?.gameType === 'chkobba' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleTeamSwitch}
            className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brass/90 text-black flex items-center justify-center border border-brass shadow-lg z-20"
            title="Switch team"
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Name */}
      <span className={`text-[9px] sm:text-[10px] font-ancient font-bold tracking-wide max-w-[60px] truncate ${
        isMe ? 'text-brass' : 'text-cream/60'
      }`}>
        {player.nickname}
      </span>

      {/* Team badge */}
      <span className={`text-[7px] sm:text-[8px] font-ancient uppercase tracking-widest px-1.5 py-0.5 rounded ${
        player.team === 0
          ? 'bg-amber-600/70 text-black font-bold'
          : 'bg-teal-600/70 text-black font-bold'
      }`}>
        Team {player.team + 1}
      </span>
    </motion.div>
  );
}

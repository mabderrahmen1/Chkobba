import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { useState, useEffect, useRef } from 'react';
import type { GameType } from '@shared/rules.js';

export function LobbyScreen() {
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = room?.hostId === playerId;
  const addToast = useUIStore((s) => s.addToast);

  const [settings, setSettings] = useState({
    maxPlayers: room?.maxPlayers || 2,
    gameType: (room?.gameType || 'chkobba') as GameType,
    targetScore: room?.targetScore || 21,
    turnTimeout: room?.turnTimeout ?? 60,
  });

  const emitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (room) {
      setSettings({
        maxPlayers: room.maxPlayers,
        gameType: room.gameType,
        targetScore: room.targetScore,
        turnTimeout: room.turnTimeout ?? 60,
      });
    }
  }, [room?.id, room?.maxPlayers, room?.gameType, room?.targetScore, room?.turnTimeout]);

  if (!room || !playerId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-bg">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-text-secondary text-sm animate-pulse">Loading lobby...</p>
      </div>
    );
  }

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isReady = currentPlayer?.isReady ?? false;
  const allReady = room.players.length === room.maxPlayers && room.players.every(p => p.isBot || p.isReady);

  const handleCopy = () => {
    navigator.clipboard?.writeText(room.id)
      .then(() => addToast('Room code copied!', 'success'))
      .catch(() => addToast('Failed to copy', 'error'));
  };

  const handleReady = () => socket.emit('player_ready');
  const handleStart = () => socket.emit('start_game');
  const handleAddBot = () => socket.emit('add_bot');

  const handleLeave = () => {
    socket.emit('leave_room');
    useUIStore.getState().setIsSubmitting(false);
    useUIStore.getState().setScreen('landing');
    sessionStorage.removeItem('chkobba-storage');
    setTimeout(() => { useGameStore.getState().reset(); }, 500);
  };

  const updateSetting = (patch: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    if (emitTimer.current) clearTimeout(emitTimer.current);
    emitTimer.current = setTimeout(() => { socket.emit('update_room_settings', newSettings); }, 150);
  };

  const handleGameTypeChange = (type: GameType) => {
    if (type === 'rummy') updateSetting({ gameType: type, maxPlayers: Math.min(settings.maxPlayers, 4), targetScore: 0 });
    else updateSetting({ gameType: type, maxPlayers: settings.maxPlayers <= 4 ? settings.maxPlayers : 2, targetScore: 21 });
  };

  const handleTeamClick = (pId: string) => {
    if (!isHost) return;
    const player = room.players.find(p => p.id === pId);
    if (!player) return;
    socket.emit('update_player_team', { playerId: pId, team: player.team === 0 ? 1 : 0 });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="h-full relative overflow-y-auto bg-bg flex flex-col"
    >
      <div className="flex flex-col gap-4 px-4 sm:px-6 max-w-2xl w-full py-6 pb-32 mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-text-primary mb-2">Lobby</h1>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            aria-label="Copy room code"
            className="font-mono text-lg tracking-[0.2em] bg-surface-1 px-4 py-1.5 rounded-lg text-accent border border-border hover:border-accent/30 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            {room.id}
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </motion.button>
        </div>

        {/* Player List */}
        <div className="bg-surface-1 rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-xs font-medium text-text-secondary">{room.players.length}/{room.maxPlayers} players</span>
          </div>
          <div className="divide-y divide-border">
            {room.players.map((player) => {
              const isMe = player.id === playerId;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    player.isBot ? 'bg-team2/10 text-team2' : isMe ? 'bg-accent/10 text-accent' : 'bg-surface-3 text-text-secondary'
                  }`}>
                    {player.isBot ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="8" width="10" height="9" rx="2" /><rect x="11" y="5" width="2" height="3" rx="1" /><circle cx="12" cy="4.5" r="1.2" /></svg>
                    ) : (
                      player.nickname.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${isMe ? 'text-accent' : 'text-text-primary'}`}>
                      {player.nickname}{isMe ? ' (you)' : ''}{player.isBot ? ' (bot)' : ''}
                    </span>
                  </div>

                  {/* Status */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    player.isBot ? 'bg-team2/10 text-team2' :
                    player.isReady ? 'bg-success/10 text-success' : 'bg-surface-3 text-text-tertiary'
                  }`}>
                    {player.isBot ? 'Bot' : player.isReady ? 'Ready' : 'Waiting'}
                  </span>

                  {/* Team badge */}
                  <button
                    onClick={() => handleTeamClick(player.id)}
                    disabled={!isHost}
                    aria-label={`${player.nickname} is on Team ${player.team + 1}${isHost ? ', click to switch team' : ''}`}
                    className={`min-w-[44px] min-h-[44px] text-[10px] font-semibold px-2 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      isHost ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                    } ${
                      player.team === 0 ? 'bg-team1/10 text-team1' : 'bg-team2/10 text-team2'
                    }`}
                  >
                    T{player.team + 1}
                  </button>

                  {/* Remove bot */}
                  {isHost && player.isBot && (
                    <button
                      onClick={() => socket.emit('remove_bot', { botId: player.id })}
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                      aria-label={`Remove ${player.nickname}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              );
            })}

            {/* Empty seats */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 opacity-30">
                <div className="w-9 h-9 rounded-full bg-surface-3 border border-dashed border-border flex items-center justify-center">
                  <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <span className="text-sm text-text-tertiary">Empty seat</span>
              </div>
            ))}
          </div>
        </div>

        {/* Host Settings */}
        {isHost && (
          <div className="bg-surface-1 rounded-xl border border-border p-4 space-y-4">
            <div className="text-xs font-medium text-text-secondary">Settings</div>

            <div>
              <div className="text-xs text-text-tertiary mb-2">Game Mode</div>
              <div className="flex bg-surface-2 p-1 rounded-lg border border-border max-w-[200px]">
                {(['chkobba', 'rummy'] as GameType[]).map((type) => (
                  <button key={type} onClick={() => handleGameTypeChange(type)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors rounded-md ${
                      settings.gameType === type ? 'bg-accent text-white' : 'text-text-tertiary hover:text-text-secondary'
                    }`}>{type === 'chkobba' ? 'Chkobba' : 'Rummy'}</button>
                ))}
              </div>
            </div>

            {settings.gameType === 'chkobba' && (
              <div>
                <div className="text-xs text-text-tertiary mb-2">Target Score</div>
                <div className="flex gap-2">
                  {[11, 21, 31].map((s) => (
                    <button key={s} onClick={() => updateSetting({ targetScore: s })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        settings.targetScore === s ? 'bg-accent text-white border-accent' : 'bg-surface-2 text-text-tertiary border-border hover:border-text-tertiary'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-text-tertiary mb-2">Players</div>
              {settings.gameType === 'chkobba' ? (
                <div className="flex bg-surface-2 p-1 rounded-lg border border-border max-w-[180px]">
                  {[{ n: 2, label: '1v1' }, { n: 4, label: '2v2' }].map(({ n, label }) => (
                    <button key={n} onClick={() => updateSetting({ maxPlayers: n })}
                      className={`flex-1 py-1.5 text-xs font-semibold transition-colors rounded-md ${
                        settings.maxPlayers === n ? 'bg-accent text-white' : 'text-text-tertiary hover:text-text-secondary'
                      }`}>{label}</button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <button key={n} onClick={() => updateSetting({ maxPlayers: n })}
                      className={`min-w-[44px] min-h-[44px] rounded-lg text-xs font-semibold border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        settings.maxPlayers === n ? 'bg-accent text-white border-accent' : 'bg-surface-2 text-text-tertiary border-border hover:border-text-tertiary'
                      }`}>{n}</button>
                  ))}
                </div>
              )}
            </div>

            {settings.gameType === 'chkobba' && (
              <div>
                <div className="text-xs text-text-tertiary mb-2">Turn Timer</div>
                <div className="flex gap-2 flex-wrap">
                  {[{ v: 0, label: 'Off' }, { v: 30, label: '30s' }, { v: 60, label: '60s' }, { v: 90, label: '90s' }, { v: 120, label: '2m' }].map(({ v, label }) => (
                    <button key={v} onClick={() => updateSetting({ turnTimeout: v })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        settings.turnTimeout === v ? 'bg-accent text-white border-accent' : 'bg-surface-2 text-text-tertiary border-border hover:border-text-tertiary'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isHost && (
          <div className="bg-surface-1 rounded-xl border border-border p-4 text-center">
            <span className="text-text-primary font-semibold">{room.gameType === 'chkobba' ? 'Chkobba' : 'Rummy'}</span>
            {room.gameType === 'chkobba' && <span className="text-text-secondary text-sm ml-2">Target: {room.targetScore}</span>}
            <p className="text-text-tertiary text-xs mt-2 animate-pulse">Waiting for host to start...</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex gap-3 w-full max-w-xl px-4 pointer-events-auto bg-surface-1 border border-border p-3 rounded-xl shadow-lg mx-4"
        >
          <Button onClick={handleReady} disabled={isReady} className="flex-1" size="md">
            {isReady ? 'Ready' : 'Ready Up'}
          </Button>
          {isHost && room.players.length < room.maxPlayers && (
            <Button variant="secondary" onClick={handleAddBot} className="flex-1" size="md">Add Bot</Button>
          )}
          {isHost && room.players.length === room.maxPlayers && (
            <Button variant="success" onClick={handleStart} disabled={!allReady} className="flex-1" size="md">
              {allReady ? 'Start' : 'Waiting...'}
            </Button>
          )}
          <Button variant="danger" onClick={handleLeave} className="flex-1" size="md">Leave</Button>
        </motion.div>
      </div>
    </motion.section>
  );
}

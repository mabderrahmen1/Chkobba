import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { PlayerAvatar } from '../PlayerAvatar';
import { useState, useEffect, type MouseEvent, type CSSProperties } from 'react';
import type { GameType } from '@shared/rules.js';

/** Same shell as the game settings felt: dark green radial + brass border */
const lobbyPanelClass =
  'relative rounded-[28px] sm:rounded-[32px] border-[2px] sm:border-[4px] border-brass/20 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.85),inset_0_0_60px_rgba(0,0,0,0.65)]';

const lobbyPanelBg: CSSProperties = {
  background:
    'radial-gradient(ellipse at 50% 40%, rgba(58, 107, 53, 0.95) 0%, rgba(45, 84, 41, 0.98) 60%, rgba(30, 58, 28, 1) 100%)',
};

const feltNoise: CSSProperties = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
  opacity: 0.04,
};

export function LobbyScreen() {
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = room?.hostId === playerId;
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);

  const [settings, setSettings] = useState({
    maxPlayers: room?.maxPlayers || 2,
    gameType: (room?.gameType || 'chkobba') as GameType,
    targetScore: room?.targetScore || 21,
    turnTimeout: room?.turnTimeout ?? 0,
  });

  useEffect(() => {
    if (room) {
      setSettings({
        maxPlayers: room.maxPlayers,
        gameType: room.gameType,
        targetScore: room.targetScore,
        turnTimeout: room.turnTimeout ?? 0,
      });
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
  const isReady = currentPlayer?.isReady ?? false;
  const allReady = room.players.length === room.maxPlayers && room.players.every((p) => p.isBot || p.isReady);
  const readyCount = room.players.filter((p) => p.isBot || p.isReady).length;
  const rosterTotal = room.players.length;

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
    setTimeout(() => {
      useGameStore.getState().reset();
    }, 500);
  };

  const updateSetting = (patch: Partial<typeof settings>) => {
    if (
      patch.maxPlayers === 2 &&
      room.players.length > 2
    ) {
      addToast(
        'Too many players in the lobby to switch to 1v1. Ask someone to leave or stay in 2v2.',
        'error',
      );
      return;
    }
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    socket.emit('update_room_settings', newSettings);
  };

  const handleGameTypeChange = (type: GameType) => {
    if (type === 'rummy') {
      updateSetting({ gameType: type, maxPlayers: Math.min(settings.maxPlayers, 4), targetScore: 0 });
    } else {
      const nextMax = settings.maxPlayers <= 4 ? settings.maxPlayers : 2;
      if (nextMax === 2 && room.players.length > 2) {
        addToast(
          'Too many players in the lobby to use 1v1 settings. Remove players first or stay in 2v2.',
          'error',
        );
        return;
      }
      updateSetting({ gameType: type, maxPlayers: nextMax, targetScore: 21 });
    }
  };

  const TableFelt = () => (
    <div className={`${lobbyPanelClass} w-full max-w-[500px] mx-auto`} style={lobbyPanelBg}>
      <div className="absolute inset-0 pointer-events-none" style={feltNoise} />
      <div className="absolute inset-0 rounded-[26px] sm:rounded-[30px] pointer-events-none border border-white/10" />

      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-8 gap-6 sm:gap-8 min-h-[320px] sm:min-h-[360px]">
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
                    type="button"
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

            {settings.gameType === 'chkobba' && (
              <div className="w-full max-w-[280px]">
                <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                  Target Score
                </div>
                <div className="flex justify-center gap-4 sm:gap-5">
                  {[11, 21, 31].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateSetting({ targetScore: s })}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-ancient font-bold text-sm sm:text-base border-2 transition-colors duration-200 ${
                        settings.targetScore === s
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                          : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full max-w-[280px]">
              <div className="text-cream/50 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-center mb-3 font-bold">
                Table size
              </div>
              {settings.gameType === 'chkobba' ? (
                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 max-w-[220px] mx-auto shadow-inner-dark">
                  {[{ n: 2, label: '1 vs 1' }, { n: 4, label: '2 vs 2' }].map(({ n, label }) => {
                    const block1v1 = n === 2 && room.players.length > 2;
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={block1v1}
                        title={
                          block1v1
                            ? 'Trop de joueurs pour passer en 1v1 — faites partir des joueurs ou restez en 2v2'
                            : undefined
                        }
                        onClick={() => updateSetting({ maxPlayers: n })}
                        className={`flex-1 py-1.5 sm:py-2.5 font-ancient text-xs sm:text-sm font-bold tracking-widest transition-all duration-300 rounded-lg ${
                          settings.maxPlayers === n
                            ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                            : block1v1
                              ? 'bg-transparent text-cream/20 cursor-not-allowed opacity-50'
                              : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex justify-center gap-3 sm:gap-4">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateSetting({ maxPlayers: n })}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-ancient font-bold text-sm sm:text-base border-2 transition-colors duration-200 ${
                        settings.maxPlayers === n
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                          : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                      }`}
                    >
                      {n}
                    </button>
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
                  {[
                    { v: 0, label: 'Off' },
                    { v: 30, label: '30s' },
                    { v: 60, label: '60s' },
                    { v: 90, label: '90s' },
                    { v: 120, label: '2m' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateSetting({ turnTimeout: v })}
                      className={`px-3 py-1.5 rounded-lg font-ancient font-bold text-[10px] sm:text-[11px] border transition-colors duration-200 ${
                        settings.turnTimeout === v
                          ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                          : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-white/5 shadow-inner-dark'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center px-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-brass-light to-brass-dark font-ancient text-xl sm:text-2xl uppercase tracking-[0.3em] font-extrabold drop-shadow-md">
              {room.gameType === 'chkobba' ? 'Chkobba' : 'Rummy'}
            </span>
            {room.gameType === 'chkobba' && (
              <span className="text-cream/60 font-ancient text-sm tracking-widest bg-black/40 px-4 py-1 rounded-full border border-white/5">
                Target: {room.targetScore} pts
              </span>
            )}
            <span className="text-cream/45 font-ancient text-xs uppercase tracking-widest">
              {room.players.length}/{room.maxPlayers} joueurs
            </span>
            <span className="text-cream/35 font-ancient text-[11px]">Paramètres visibles par l&apos;hôte uniquement</span>
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
      className="h-full min-h-0 flex flex-col relative overflow-hidden bg-transparent"
    >
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(26,18,14,0.7) 0%, rgba(26,18,14,1) 90%)',
        }}
      />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col">
        <div className="flex flex-col gap-5 sm:gap-6 px-3 sm:px-6 max-w-2xl w-full mx-auto pt-8 sm:pt-10 pb-40 sm:pb-44">
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="text-center shrink-0"
          >
            <h2 className="text-xl sm:text-2xl font-ancient font-bold text-brass mb-2 uppercase tracking-widest">Lobby</h2>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-cream-dark/50 font-ancient text-xs">Room Code</span>
              <motion.button
                type="button"
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

          <TableFelt />

          <PlayersPanel
            room={room}
            playerId={playerId}
            isHost={isHost}
            readyCount={readyCount}
            rosterTotal={rosterTotal}
          />
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div
        className="shrink-0 z-50 border-t border-white/15 bg-[#0a0806]/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.65)] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
            <Button onClick={handleReady} disabled={isReady} className="flex-1 min-w-[140px] max-w-[220px]" size="lg">
              {isReady ? 'Ready ✓' : 'Ready Up'}
            </Button>

            {isHost && room.players.length < room.maxPlayers && (
              <Button variant="secondary" onClick={handleAddBot} className="flex-1 min-w-[140px] max-w-[220px]" size="lg">
                Add Bot
              </Button>
            )}

            {isHost && room.players.length === room.maxPlayers && (
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[160px] max-w-[240px]">
                <Button
                  variant="success"
                  onClick={handleStart}
                  disabled={!allReady}
                  className={`w-full ${!allReady ? 'opacity-50 saturate-50' : ''}`}
                  size="lg"
                >
                  Start Game
                </Button>
                {!allReady && (
                  <span className="text-[11px] sm:text-xs font-ancient text-amber-200/80 tracking-wide text-center">
                    {readyCount} / {rosterTotal} prêts — en attente des joueurs
                  </span>
                )}
              </div>
            )}

            <Button variant="danger" onClick={handleLeave} className="flex-1 min-w-[140px] max-w-[220px]" size="lg">
              Leave
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function PlayersPanel({
  room,
  playerId,
  isHost,
  readyCount,
  rosterTotal,
}: {
  room: NonNullable<ReturnType<typeof useGameStore.getState>['room']>;
  playerId: string;
  isHost: boolean;
  readyCount: number;
  rosterTotal: number;
}) {
  const emptySlots = Math.max(0, room.maxPlayers - room.players.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className={`${lobbyPanelClass} w-full`}
      style={lobbyPanelBg}
    >
      <div className="absolute inset-0 pointer-events-none" style={feltNoise} />
      <div className="absolute inset-0 rounded-[26px] sm:rounded-[30px] pointer-events-none border border-white/10" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/10 bg-black/25">
          <h3 className="font-ancient font-bold text-sm sm:text-base text-cream/95 uppercase tracking-[0.2em]">Joueurs</h3>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-ancient text-cream/55 uppercase tracking-widest">
            <span>
              {room.players.length}/{room.maxPlayers} inscrits
            </span>
            <span className="text-cream/25">·</span>
            <span className="text-emerald-300/90">{readyCount}/{rosterTotal} prêts</span>
          </div>
        </div>

        <ul className="divide-y divide-white/10">
          {room.players.map((p) => (
            <PlayerRow key={p.id} player={p} room={room} viewerId={playerId} isHost={isHost} />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-black/15 border-l-2 border-dashed border-white/15"
            >
              <div className="w-11 h-11 rounded-xl border-2 border-dashed border-white/20 bg-black/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-ancient text-sm text-cream/35 uppercase tracking-widest">Siège libre</p>
                <p className="text-[10px] text-cream/25 mt-0.5">En attente d&apos;un joueur</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function PlayerRow({
  player,
  room,
  viewerId,
  isHost,
}: {
  player: NonNullable<ReturnType<typeof useGameStore.getState>['room']>['players'][number];
  room: NonNullable<ReturnType<typeof useGameStore.getState>['room']>;
  viewerId: string;
  isHost: boolean;
}) {
  const isMe = player.id === viewerId;
  const isBot = player.isBot;
  const isReady = player.isBot || player.isReady;
  const canHostKick = isHost && !isMe && !player.isHost;

  const roleLabel = player.isHost ? 'Hôte' : isBot ? 'Bot' : 'Joueur';

  const handleTeamClick = () => {
    if (!isHost) return;
    const newTeam = player.team === 0 ? 1 : 0;
    socket.emit('update_player_team', { playerId: player.id, team: newTeam });
  };

  const handleKick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!canHostKick) return;
    const msg = isBot ? 'Retirer ce bot de la table ?' : `Expulser ${player.nickname} ?`;
    if (!window.confirm(msg)) return;
    socket.emit('kick_player', { playerId: player.id });
  };

  const showTeam = room.maxPlayers >= 2;

  return (
    <li
      className={`flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5 transition-colors ${
        isBot ? 'bg-sky-950/25 border-l-[3px] border-sky-500/45' : 'bg-transparent border-l-[3px] border-transparent'
      } ${isMe ? 'ring-1 ring-inset ring-brass/35 bg-brass/5' : ''}`}
    >
      <div className="shrink-0">
        <PlayerAvatar username={player.nickname} />
      </div>

      <div className="flex-1 min-w-[140px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`font-ancient font-extrabold text-sm sm:text-base tracking-wide truncate max-w-[200px] sm:max-w-[240px] ${
              isMe ? 'text-transparent bg-clip-text bg-gradient-to-r from-brass-light to-brass-dark' : 'text-cream/95'
            }`}
          >
            {player.nickname}
            {isMe && <span className="text-brass/80 font-normal text-xs ml-1">(vous)</span>}
          </span>
          <span
            className={`text-[10px] sm:text-[11px] font-ancient font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border ${
              player.isHost
                ? 'border-brass/50 text-brass-light bg-brass/10'
                : isBot
                  ? 'border-sky-500/40 text-sky-200 bg-sky-950/50'
                  : 'border-white/20 text-cream/70 bg-black/35'
            }`}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start sm:ml-auto">
        {showTeam && (
          <button
            type="button"
            onClick={handleTeamClick}
            disabled={!isHost}
            title={isHost ? 'Changer d’équipe' : undefined}
            className={`text-[10px] font-ancient font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${
              isHost ? 'hover:brightness-110 cursor-pointer' : 'cursor-default opacity-90'
            } ${
              player.team === 0
                ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-black border-amber-500/50'
                : 'bg-gradient-to-r from-teal-600 to-teal-800 text-black border-teal-500/50'
            }`}
          >
            Équipe {player.team + 1}
          </button>
        )}

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-ancient font-bold px-2.5 py-1 rounded-full border shrink-0 ${
            isReady
              ? 'border-emerald-500/55 bg-emerald-950/70 text-emerald-200'
              : 'border-amber-500/45 bg-amber-950/50 text-amber-100'
          }`}
        >
          {isReady ? (
            <>
              <span aria-hidden>✅</span> Prêt
            </>
          ) : (
            <>
              <span aria-hidden>⏳</span> En attente
            </>
          )}
        </span>

        {canHostKick && (
          <button
            type="button"
            onClick={handleKick}
            className="text-[10px] font-ancient font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg border border-red-500/50 bg-red-950/80 text-red-100 hover:bg-red-900/90 shrink-0"
          >
            {isBot ? 'Retirer' : 'Expulser'}
          </button>
        )}
      </div>
    </li>
  );
}

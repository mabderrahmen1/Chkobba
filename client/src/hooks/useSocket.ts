import { useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import { useGameStore } from '../stores/useGameStore';
import { useUIStore } from '../stores/useUIStore';
import { useChatStore } from '../stores/useChatStore';
import { useSocketStore } from '../stores/useSocketStore';
import { useEmoteStore } from '../stores/useEmoteStore';
import { getEmoteById } from '../lib/emoteCatalog';
import { playAssetSoundMp3, stopCelebrationPlayback } from '../lib/playAssetSound';
import { dealAnimationDurationMs } from '@shared/timing';

/** Detect real moves vs duplicate `game_state` echoes — stops Chkobba/Hayya celebration audio on any card play. */
let prevChkobbaGameStateSnapshot: string | null = null;

/** Skip stopping celebration when the next `game_state` is the companion update for the same capture (ordering varies). */
let lastChkobbaHayyaSocketAt = 0;

/** One active clear timer each — new Chkobba/Hayya cancels the previous so rapid repeats don’t reset the name early. */
let chkobbaClearTimer: ReturnType<typeof setTimeout> | null = null;
let hayyaClearTimer: ReturnType<typeof setTimeout> | null = null;

function chkobbaGameStateSnapshot(data: Record<string, unknown>): string {
  const tableCards = (data.tableCards as { rank?: string; suit?: string }[] | undefined) ?? [];
  const tc = tableCards.map((c) => `${c.rank}-${c.suit}`).join('|');
  const players = (data.players as { hand?: unknown[] }[] | undefined) ?? [];
  const hl = players.map((p) => p.hand?.length ?? 0).join(',');
  return JSON.stringify({
    tc,
    hl,
    turn: data.currentTurn,
    round: data.roundNumber,
  });
}

export function useSocket() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { roomId, playerId, room } = useGameStore.getState();
    
    if (roomId && playerId) {
      if (room && room.status === 'playing') {
        useUIStore.getState().setScreen('game');
      } else {
        useUIStore.getState().setScreen('lobby');
      }
    }

    socket.on('connect', () => {
      useSocketStore.getState().setConnected(true);
      const state = useGameStore.getState();
      if (state.roomId && state.playerId) {
        socket.emit('rejoin_game', { roomId: state.roomId, playerId: state.playerId });
      }
    });

    socket.on('disconnect', () => useSocketStore.getState().setConnected(false));

    socket.on('error', (data: { message: string }) => {
      const msg = data.message.toLowerCase();
      if (msg.includes('room not found') || msg.includes('session not found')) {
         useGameStore.getState().reset();
         useUIStore.getState().setScreen('landing');
      } else {
         useUIStore.getState().addToast(data.message, msg.includes('now the host') ? 'success' : 'error');
      }
    });

    socket.on('room_joined', (data: { room: any; player: any }) => {
      const g = useGameStore.getState();
      const currentScreen = useUIStore.getState().screen;
      if (currentScreen === 'landing' && !data.room) return; // Prevent hijacking during exit

      g.setRoomId(data.room.id);
      g.setPlayer(data.player.id, data.player.isHost);
      g.setRoom(data.room);
      g.setGameType(data.room.gameType || 'chkobba');
      
      if (data.room.status === 'playing') {
        useUIStore.getState().setScreen('game');
      } else {
        useUIStore.getState().setScreen('lobby');
      }
    });

    socket.on('room_update', (data: any) => {
      const ui = useUIStore.getState();
      const g = useGameStore.getState();
      
      // If we are on landing, or if our local state doesn't match the room being updated, ignore it.
      if (ui.screen === 'landing' || g.roomId !== data.id) return;

      g.setRoom(data);
      
      // Sync host status: if the room's hostId matches our playerId, we are the host
      if (data.hostId && g.playerId === data.hostId && !g.isHost) {
        g.setPlayer(g.playerId!, true);
      }
      
      // Keep gameType in sync with the room's gameType
      if (data.gameType) g.setGameType(data.gameType);
      
      // Only transition to lobby if we are in game and the server says the game ended
      if (data.status === 'lobby' && ui.screen === 'game') {
        ui.setScreen('lobby');
      }
    });

    socket.on('player_left', (data: { nickname: string }) => {
      useUIStore.getState().addToast(`${data.nickname} left the room.`, 'info');
    });

    socket.on('game_started', () => {
      prevChkobbaGameStateSnapshot = null;
      if (useUIStore.getState().screen === 'landing') return;
      const g = useGameStore.getState();
      g.setGameOverData(null);
      // Sync gameType from the room so the right game screen renders
      if (g.room?.gameType) g.setGameType(g.room.gameType);
      
      const gt = (g.room?.gameType || g.gameType || 'chkobba') as 'chkobba' | 'rummy';
      const n = g.room?.players?.length ?? 2;
      const dealMs = dealAnimationDurationMs(gt, n);

      g.setIsDistributing(true);
      setTimeout(() => {
        g.setIsDistributing(false);
      }, dealMs);

      useUIStore.getState().setScreen('game');
    });

    socket.on('game_state', (data: any) => {
      const g = useGameStore.getState();
      const ui = useUIStore.getState();

      if (ui.screen === 'landing') return;

      if ('drawPile' in data) {
        prevChkobbaGameStateSnapshot = null;
        g.setRummyGameState(data);
        g.setGameType('rummy');
      } else {
        const snap = chkobbaGameStateSnapshot(data as Record<string, unknown>);
        if (prevChkobbaGameStateSnapshot !== null && snap !== prevChkobbaGameStateSnapshot) {
          if (Date.now() - lastChkobbaHayyaSocketAt > 220) {
            stopCelebrationPlayback();
          }
        }
        prevChkobbaGameStateSnapshot = snap;
        g.setGameState(data);
        g.setGameType('chkobba');
        // Reset countdown — turn_started will re-arm it if it's still our turn
        g.setTurnTimer(null, null);
      }

      if (ui.screen === 'lobby') {
        ui.setScreen('game');
      }
    });

    socket.on('chkobba', (data: { playerNickname: string }) => {
      lastChkobbaHayyaSocketAt = Date.now();
      if (chkobbaClearTimer) {
        clearTimeout(chkobbaClearTimer);
        chkobbaClearTimer = null;
      }
      useGameStore.getState().setChkobbaPlayer(data.playerNickname);
      chkobbaClearTimer = setTimeout(() => {
        useGameStore.getState().setChkobbaPlayer(null);
        chkobbaClearTimer = null;
      }, 5000);
    });

    socket.on('new_round', () => {
      prevChkobbaGameStateSnapshot = null;
      const g = useGameStore.getState();

      g.setRoundResult(null);
      const gt = g.gameType === 'rummy' ? 'rummy' : 'chkobba';
      const n =
        gt === 'rummy'
          ? (g.rummyGameState?.players?.length ?? g.room?.players?.length ?? 2)
          : (g.gameState?.players?.length ?? g.room?.players?.length ?? 2);
      const dealMs = dealAnimationDurationMs(gt, n);

      g.setIsDistributing(true);
      setTimeout(() => {
        g.setIsDistributing(false);
      }, dealMs);
    });

    socket.on('hayya_captured', (data: { playerNickname: string }) => {
      lastChkobbaHayyaSocketAt = Date.now();
      if (hayyaClearTimer) {
        clearTimeout(hayyaClearTimer);
        hayyaClearTimer = null;
      }
      useGameStore.getState().setHayyaPlayer(data.playerNickname);
      hayyaClearTimer = setTimeout(() => {
        useGameStore.getState().setHayyaPlayer(null);
        hayyaClearTimer = null;
      }, 5000);
    });

    socket.on('round_end', (data: any) => useGameStore.getState().setRoundResult(data));

    socket.on('game_over', (data: { winner: any; scores?: any }) => {
      const g = useGameStore.getState();
      if (useUIStore.getState().screen === 'landing') return;
      
      g.setGameOverData({
        winner: data.winner,
        scores: data.scores || g.gameState?.scores || { team0: 0, team1: 0 },
      });
    });

    socket.on('lobby_reset', () => {
      prevChkobbaGameStateSnapshot = null;
      const ui = useUIStore.getState();
      if (ui.screen === 'landing') return;

      const g = useGameStore.getState();
      ui.setScreen('lobby');
      setTimeout(() => {
        g.setGameOverData(null);
        g.setGameState(null as any);
        g.setRummyGameState(null as any);
        g.setRoundResult(null);
      }, 50);
    });

    socket.on('game_emote', (data: { playerId: string; emoteId: string }) => {
      const meta = getEmoteById(data.emoteId);
      if (!meta) return;
      const myId = useGameStore.getState().playerId;
      // Local click already plays once; avoid double audio when the room echoes back.
      if (data.playerId !== myId) {
        playAssetSoundMp3(meta.file, `emote:${data.emoteId}`);
      }
      useEmoteStore.getState().flashForPlayer(data.playerId, meta.icon, meta.label, 2000);
    });

    socket.on('chat_message', (data: any) => {
      const chat = useChatStore.getState();
      const myPlayerId = useGameStore.getState().playerId;
      
      chat.addMessage(data);
      
      // Auto-open chat if message is from someone else and not system
      if (data.playerId !== myPlayerId && data.playerId !== 'system') {
        chat.setOpen(true);
      }
    });

    socket.on('turn_started', (data: { playerId: string; timeout: number; startedAt: number }) => {
      const g = useGameStore.getState();
      // Only track the timer if it's our turn
      if (data.playerId === g.playerId) {
        g.setTurnTimer(data.startedAt, data.timeout);
      } else {
        g.setTurnTimer(null, null);
      }
    });

    socket.on('player_afk_kicked', (data: { playerId: string; playerNickname: string }) => {
      const g = useGameStore.getState();
      if (data.playerId === g.playerId) {
        // We were kicked — clear state and go to landing
        g.reset();
        useUIStore.getState().setScreen('landing');
        useUIStore.getState().addToast('You were removed for inactivity.', 'error');
      } else {
        useUIStore.getState().addToast(`${data.playerNickname} was replaced by a bot (AFK).`, 'info');
        // Reset our own countdown since the turn will change
        g.setTurnTimer(null, null);
      }
    });

    socket.on('kicked_by_host', () => {
      sessionStorage.removeItem('chkobba-storage');
      useGameStore.getState().reset();
      useUIStore.getState().setIsSubmitting(false);
      useUIStore.getState().setScreen('landing');
      useUIStore.getState().addToast('The host removed you from the table.', 'error');
    });

  }, []);
}

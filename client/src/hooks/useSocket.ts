import { useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import { useGameStore } from '../stores/useGameStore';
import { useUIStore } from '../stores/useUIStore';
import { useChatStore } from '../stores/useChatStore';
import { useSocketStore } from '../stores/useSocketStore';

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
      if (useUIStore.getState().screen === 'landing') return;
      const g = useGameStore.getState();
      g.setGameOverData(null);
      // Sync gameType from the room so the right game screen renders
      if (g.room?.gameType) g.setGameType(g.room.gameType);
      
      // Trigger dealing animation for the very first round
      g.setIsDistributing(true);
      setTimeout(() => {
        g.setIsDistributing(false);
      }, 2800);
      
      useUIStore.getState().setScreen('game');
    });

    socket.on('game_state', (data: any) => {
      const g = useGameStore.getState();
      const ui = useUIStore.getState();

      if (ui.screen === 'landing') return;

      if ('drawPile' in data) {
        g.setRummyGameState(data);
        g.setGameType('rummy');
      } else {
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
      useGameStore.getState().setChkobbaPlayer(data.playerNickname);
      setTimeout(() => useGameStore.getState().setChkobbaPlayer(null), 5000);
    });

    socket.on('new_round', () => {
      const g = useGameStore.getState();
      
      g.setRoundResult(null);
      g.setIsDistributing(true);
      
      // Auto-end distribution after animation time (extended to match shuffle + deal)
      setTimeout(() => {
        g.setIsDistributing(false);
      }, 2800);
    });

    socket.on('hayya_captured', (data: { playerNickname: string }) => {
      useGameStore.getState().setHayyaPlayer(data.playerNickname);
      setTimeout(() => useGameStore.getState().setHayyaPlayer(null), 5000);
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

  }, []);
}

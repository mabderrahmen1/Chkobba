import { useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import { useGameStore } from '../stores/useGameStore';
import { useUIStore } from '../stores/useUIStore';
import { useChatStore } from '../stores/useChatStore';
import { useSocketStore } from '../stores/useSocketStore';

export function useSocket() {
  const initialized = useRef(false);
  const reconnectAttempted = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { roomId, playerId, room } = useGameStore.getState();
    
    // IMMEDIATELY restore the correct screen on load
    if (roomId && playerId) {
      if (room && room.status === 'playing') {
        console.log('[App] Session was in-game, restoring Game screen');
        useUIStore.getState().setScreen('game');
      } else {
        console.log('[App] Session was in lobby, restoring Lobby screen');
        useUIStore.getState().setScreen('lobby');
      }
    }

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected. ID:', socket.id);
      useSocketStore.getState().setConnected(true);
      
      const currentState = useGameStore.getState();
      if (currentState.roomId && currentState.playerId) {
        socket.emit('rejoin_game', { 
          roomId: currentState.roomId, 
          playerId: currentState.playerId 
        });
        reconnectAttempted.current = true;
      }
    });

    socket.on('disconnect', () => {
      useSocketStore.getState().setConnected(false);
    });

    socket.on('error', (data: { message: string }) => {
      console.error('[Socket] Server Error:', data.message);
      
      const msg = data.message.toLowerCase();
      // Only clear session if the server definitively says the room or player is gone
      if (msg.includes('room not found') || msg.includes('session not found')) {
         console.warn('[Socket] Session invalid, clearing local storage.');
         useGameStore.getState().reset();
         useUIStore.getState().setScreen('landing');
      } else {
         // Show as toast for other errors (like "You are now host")
         useUIStore.getState().addToast(data.message, msg.includes('now the host') ? 'success' : 'error');
      }
    });

    socket.on('room_joined', (data: { room: any; player: any }) => {
      const g = useGameStore.getState();
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

    socket.on('game_state', (data: any) => {
      const g = useGameStore.getState();
      if ('drawPile' in data || 'discardPile' in data) {
        g.setRummyGameState(data);
      } else {
        g.setGameState(data);
      }
      
      // Critical: Ensure we stay on game screen if we have state
      useUIStore.getState().setScreen('game');
    });

    socket.on('room_update', (data: any) => {
      useGameStore.getState().setRoom(data);
      // Ensure we are on the correct screen based on room status
      if (data.status === 'lobby') {
        const currentScreen = useUIStore.getState().screen;
        if (currentScreen === 'game') {
          console.log('[Socket] Room returned to lobby, switching screen');
          useUIStore.getState().setScreen('lobby');
        }
      }
    });

    socket.on('player_joined', (data: { player: { nickname: string } }) => {
      useChatStore.getState().addMessage({
        message: `${data.player.nickname} joined the room`,
        timestamp: Date.now(),
        isSystem: true,
      });
    });

    socket.on('player_disconnected', (data: { playerId: string }) => {
      const room = useGameStore.getState().room;
      const player = room?.players.find((p) => p.id === data.playerId);
      if (player) {
        useChatStore.getState().addMessage({
          message: `${player.nickname} disconnected`,
          timestamp: Date.now(),
          isSystem: true,
        });
      }
    });

    socket.on('player_reconnected', (data: { playerId: string }) => {
      const room = useGameStore.getState().room;
      const player = room?.players.find((p) => p.id === data.playerId);
      if (player) {
        useChatStore.getState().addMessage({
          message: `${player.nickname} reconnected`,
          timestamp: Date.now(),
          isSystem: true,
        });
      }
    });

    socket.on('game_started', () => {
      console.log('[Socket] game_started received');
      const g = useGameStore.getState();
      g.setGameOverData(null);
      g.setRoundResult(null);
      useUIStore.getState().setScreen('game');
    });

    socket.on('chkobba', (data: { playerNickname: string }) => {
      useGameStore.getState().setChkobbaPlayer(data.playerNickname);
      setTimeout(() => useGameStore.getState().setChkobbaPlayer(null), 3500);
    });

    socket.on('hayya_captured', (data: { playerNickname: string }) => {
      useGameStore.getState().setHayyaPlayer(data.playerNickname);
      setTimeout(() => useGameStore.getState().setHayyaPlayer(null), 3000);
    });

    socket.on('round_end', (data: any) => {
      useGameStore.getState().setRoundResult(data);
    });

    socket.on('game_over', (data: { winner: any; scores?: any }) => {
      const g = useGameStore.getState();
      g.setGameOverData({
        winner: data.winner,
        scores: data.scores || g.gameState?.scores || { team0: 0, team1: 0 },
      });
    });

    socket.on('auto_win_warning', (data: { timeRemaining: number; playerNickname: string }) => {
      useGameStore.getState().setAutoWinWarning(data);
    });

    socket.on('lobby_reset', () => {
      const g = useGameStore.getState();
      g.setGameOverData(null);
      g.setGameState(null as any);
      g.setRummyGameState(null as any);
      g.setRoundResult(null);
      useUIStore.getState().setScreen('lobby');
    });

    socket.on('auto_win', (data: { winner: any }) => {
      const g = useGameStore.getState();
      g.setAutoWinWarning(null);
      g.setGameOverData({
        winner: data.winner,
        scores: g.gameState?.scores || { team0: 0, team1: 0 },
      });
    });

    socket.on('chat_message', (data: any) => {
      useChatStore.getState().addMessage(data);
    });

    socket.on('start_game', () => {
      socket.emit('start_game');
    });
  }, []);
}

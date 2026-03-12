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
      if (ui.screen === 'landing') return; // Do not update if we are leaving

      useGameStore.getState().setRoom(data);
      if (data.status === 'lobby' && ui.screen === 'game') {
        ui.setScreen('lobby');
      }
    });

    socket.on('player_left', (data: { nickname: string }) => {
      useUIStore.getState().addToast(`${data.nickname} left the room.`, 'info');
    });

    socket.on('game_started', () => {
      if (useUIStore.getState().screen === 'landing') return;
      useGameStore.getState().setGameOverData(null);
      useUIStore.getState().setScreen('game');
    });

    socket.on('game_state', (data: any) => {
      const g = useGameStore.getState();
      const ui = useUIStore.getState();
      
      if (ui.screen === 'landing') return;

      if ('drawPile' in data) g.setRummyGameState(data);
      else g.setGameState(data);
      
      if (ui.screen === 'lobby') {
        ui.setScreen('game');
      }
    });

    socket.on('chkobba', (data: { playerNickname: string }) => {
      useGameStore.getState().setChkobbaPlayer(data.playerNickname);
      setTimeout(() => useGameStore.getState().setChkobbaPlayer(null), 3500);
    });

    socket.on('hayya_captured', (data: { playerNickname: string }) => {
      useGameStore.getState().setHayyaPlayer(data.playerNickname);
      setTimeout(() => useGameStore.getState().setHayyaPlayer(null), 3000);
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
        g.setRoundResult(null);
      }, 50);
    });

    socket.on('chat_message', (data: any) => useChatStore.getState().addMessage(data));
  }, []);
}

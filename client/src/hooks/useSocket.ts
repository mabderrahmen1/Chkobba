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

    // Connection events
    socket.on('connect', () => {
      useSocketStore.getState().setConnected(true);
      const { roomId, nickname } = useGameStore.getState();
      if (roomId && nickname) {
        socket.emit('rejoin_room', { roomId, nickname });
      }
    });

    socket.on('disconnect', () => {
      useSocketStore.getState().setConnected(false);
      useUIStore.getState().addToast('Disconnected from server', 'error');
    });

    socket.on('error', (data: { message: string }) => {
      useUIStore.getState().addToast(data.message || 'Something went wrong', 'error');
    });

    // Room events
    socket.on('room_created', (data: { roomId: string }) => {
      useGameStore.getState().setRoomId(data.roomId);
      useUIStore.getState().setScreen('lobby');
    });

    socket.on('room_joined', (data: { room: any; player: any }) => {
      const g = useGameStore.getState();
      g.setRoomId(data.room.id);
      g.setPlayer(data.player.id, data.player.isHost);
      g.setRoom(data.room);
      
      // If we joined and the game is already playing, jump straight to game
      if (data.room.status === 'playing') {
        useUIStore.getState().setScreen('game');
      } else {
        useUIStore.getState().setScreen('lobby');
      }
    });

    socket.on('room_update', (data: any) => {
      useGameStore.getState().setRoom(data);
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

    // Game events
    socket.on('game_started', () => {
      useUIStore.getState().setScreen('game');
    });

    socket.on('game_state', (data: any) => {
      const g = useGameStore.getState();
      const prevWinner = g.gameState?.winner;
      g.setGameState(data);

      // Detect game over from game state
      if (data.winner && !prevWinner) {
        g.setGameOverData({
          winner: data.winner,
          scores: data.scores,
        });
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

    // Chat
    socket.on('chat_message', (data: any) => {
      useChatStore.getState().addMessage(data);
    });

    // Start game event from server (auto-start when all ready)
    socket.on('start_game', () => {
      // Server tells host to start - relay it back
      socket.emit('start_game');
    });
  }, []);
}

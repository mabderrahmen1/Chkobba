import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoomState as Room, GameState, CaptureOption, RoundResult, Winner, RummyGameState } from '@shared/types.js';
import type { GameType } from '@shared/rules.js';

interface GameOverData {
  winner: Winner;
  scores: { team0: number; team1: number };
}

interface AutoWinWarning {
  timeRemaining: number;
  playerNickname: string;
}

interface GameStore {
  nickname: string;
  playerId: string | null;
  roomId: string | null;
  isHost: boolean;
  room: Room | null;
  gameState: GameState | null;
  rummyGameState: RummyGameState | null;
  gameType: GameType | null;
  selectedCardIndex: number | null;
  selectedTableIndices: number[];
  roundResult: RoundResult | null;
  gameOverData: GameOverData | null;
  autoWinWarning: AutoWinWarning | null;
  chkobbaPlayer: string | null;
  hayyaPlayer: string | null;
  lastCaptureType: 'capture' | 'chkobba' | 'hayya' | null;
  turnStartedAt: number | null;
  turnTimeoutSec: number | null;

  setNickname: (nickname: string) => void;
  setPlayer: (playerId: string, isHost: boolean) => void;
  setRoom: (room: Room | null) => void;
  setRoomId: (roomId: string | null) => void;
  setGameState: (gameState: GameState) => void;
  setRummyGameState: (gameState: RummyGameState) => void;
  setGameType: (gameType: GameType) => void;
  setSelectedCard: (index: number | null) => void;
  toggleTableCard: (index: number) => void;
  clearSelections: () => void;
  setRoundResult: (result: RoundResult | null) => void;
  setGameOverData: (data: GameOverData | null) => void;
  setAutoWinWarning: (data: AutoWinWarning | null) => void;
  setChkobbaPlayer: (name: string | null) => void;
  setHayyaPlayer: (name: string | null) => void;
  setLastCaptureType: (type: 'capture' | 'chkobba' | 'hayya' | null) => void;
  setTurnTimer: (startedAt: number | null, timeoutSec: number | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      nickname: '',
      playerId: null,
      roomId: null,
      isHost: false,
      room: null,
      gameState: null,
      rummyGameState: null,
      gameType: null,
      selectedCardIndex: null,
      selectedTableIndices: [],
      roundResult: null,
      gameOverData: null,
      autoWinWarning: null,
      chkobbaPlayer: null,
      hayyaPlayer: null,
      lastCaptureType: null,
      turnStartedAt: null,
      turnTimeoutSec: null,

      setNickname: (nickname) => set({ nickname }),
      setPlayer: (playerId, isHost) => set({ playerId, isHost }),
      setRoom: (room) => set({ room }),
      setRoomId: (roomId) => set({ roomId }),
      setGameState: (gameState) => {
        console.log('[Store] Updating game state', !!gameState);
        set({
          gameState,
          selectedTableIndices: [] // Clear selections when game state updates (new turn/round)
        });
      },
      setRummyGameState: (rummyGameState) => set({ rummyGameState }),
      setGameType: (gameType) => set({ gameType }),
      setSelectedCard: (selectedCardIndex) => set({ selectedCardIndex }),
      toggleTableCard: (index) => set((state) => {
        const isSelected = state.selectedTableIndices.includes(index);
        return {
          selectedTableIndices: isSelected
            ? state.selectedTableIndices.filter((i) => i !== index)
            : [...state.selectedTableIndices, index],
        };
      }),
      clearSelections: () => set({ selectedTableIndices: [], selectedCardIndex: null }),
      setRoundResult: (roundResult) => set({ roundResult }),
      setGameOverData: (gameOverData) => set({ gameOverData }),
      setAutoWinWarning: (autoWinWarning) => set({ autoWinWarning }),
      setChkobbaPlayer: (chkobbaPlayer) => set({ chkobbaPlayer }),
      setHayyaPlayer: (hayyaPlayer) => set({ hayyaPlayer }),
      setLastCaptureType: (lastCaptureType) => set({ lastCaptureType }),
      setTurnTimer: (turnStartedAt, turnTimeoutSec) => set({ turnStartedAt, turnTimeoutSec }),
      reset: () =>
        set({
          nickname: '',
          playerId: null,
          roomId: null,
          isHost: false,
          room: null,
          gameState: null,
          rummyGameState: null,
          gameType: null,
          selectedCardIndex: null,
          selectedTableIndices: [],
          roundResult: null,
          gameOverData: null,
          autoWinWarning: null,
          chkobbaPlayer: null,
          hayyaPlayer: null,
          lastCaptureType: null,
          turnStartedAt: null,
          turnTimeoutSec: null,
        }),
    }),
    {
      name: 'chkobba-storage',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      partialize: (state) => ({
        nickname: state.nickname,
        roomId: state.roomId,
        playerId: state.playerId,
        room: state.room,
        gameType: state.gameType
      }),
    }
  )
);

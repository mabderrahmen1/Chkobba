import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoomState as Room, GameState, CaptureOption, RoundResult, Winner } from '@shared/types.js';

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
  selectedCardIndex: number | null;
  selectedTableIndices: number[];
  roundResult: RoundResult | null;
  gameOverData: GameOverData | null;
  autoWinWarning: AutoWinWarning | null;
  chkobbaPlayer: string | null;

  setNickname: (nickname: string) => void;
  setPlayer: (playerId: string, isHost: boolean) => void;
  setRoom: (room: Room | null) => void;
  setRoomId: (roomId: string | null) => void;
  setGameState: (gameState: GameState) => void;
  setSelectedCard: (index: number | null) => void;
  toggleTableCard: (index: number) => void;
  clearSelections: () => void;
  setRoundResult: (result: RoundResult | null) => void;
  setGameOverData: (data: GameOverData | null) => void;
  setAutoWinWarning: (data: AutoWinWarning | null) => void;
  setChkobbaPlayer: (name: string | null) => void;
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
      selectedCardIndex: null,
      selectedTableIndices: [],
      roundResult: null,
      gameOverData: null,
      autoWinWarning: null,
      chkobbaPlayer: null,

      setNickname: (nickname) => set({ nickname }),
      setPlayer: (playerId, isHost) => set({ playerId, isHost }),
      setRoom: (room) => set({ room }),
      setRoomId: (roomId) => set({ roomId }),
      setGameState: (gameState) => set({ 
        gameState,
        selectedTableIndices: [] // Clear selections when game state updates (new turn/round)
      }),
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
      reset: () =>
        set({
          nickname: '',
          playerId: null,
          roomId: null,
          isHost: false,
          room: null,
          gameState: null,
          selectedCardIndex: null,
          selectedTableIndices: [],
          roundResult: null,
          gameOverData: null,
          autoWinWarning: null,
          chkobbaPlayer: null,
        }),
    }),
    {
      name: 'chkobba-storage',
      partialize: (state) => ({ 
        nickname: state.nickname, 
        roomId: state.roomId,
        playerId: state.playerId
      }),
    }
  )
);

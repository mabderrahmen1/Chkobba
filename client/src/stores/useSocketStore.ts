import { create } from 'zustand';

interface SocketStore {
  isConnected: boolean;
  setConnected: (isConnected: boolean) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),
}));

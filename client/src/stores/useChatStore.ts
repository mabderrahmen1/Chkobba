import { create } from 'zustand';
import type { ChatMessage } from '@shared/types.js';

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;

  addMessage: (msg: ChatMessage) => void;
  toggleChat: () => void;
  setOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isOpen: false,

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-49), msg],
    })),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
  clearMessages: () => set({ messages: [] }),
}));

import { create } from 'zustand';
import type { ChatMessage } from '@shared/types.js';

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  unreadCount: number;

  addMessage: (msg: ChatMessage) => void;
  toggleChat: () => void;
  setOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isOpen: false,
  unreadCount: 0,

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-49), msg],
      unreadCount: state.isOpen ? 0 : state.unreadCount + 1,
    })),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen, unreadCount: state.isOpen ? state.unreadCount : 0 })),
  setOpen: (isOpen) => set({ isOpen, unreadCount: isOpen ? 0 : get().unreadCount }),
  clearMessages: () => set({ messages: [], unreadCount: 0 }),
}));

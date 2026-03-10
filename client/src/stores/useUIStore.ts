import { create } from 'zustand';

export type Screen = 'landing' | 'createRoom' | 'joinRoom' | 'lobby' | 'game';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface UIStore {
  screen: Screen;
  toasts: Toast[];
  showAmbiance: boolean;
  ambianceSoundOn: boolean;
  musicVolume: number;
  waitressStatus: 'idle' | 'serving';
  isWaitressVisible: boolean;

  setScreen: (screen: Screen) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  toggleAmbiance: () => void;
  toggleAmbianceSound: () => void;
  setMusicVolume: (volume: number) => void;
  setWaitressStatus: (status: 'idle' | 'serving') => void;
  setWaitressVisible: (visible: boolean) => void;
}

const savedAmbiance =
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('chkobba_ambiance') !== 'false'
    : true;
const savedSound =
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('chkobba_ambiance_sound') !== 'false'
    : true;
const savedVolume =
  typeof localStorage !== 'undefined'
    ? parseFloat(localStorage.getItem('chkobba_music_volume') ?? '0.35')
    : 0.35;

export const useUIStore = create<UIStore>((set) => ({
  screen: 'landing',
  toasts: [],
  showAmbiance: savedAmbiance,
  ambianceSoundOn: savedSound,
  musicVolume: savedVolume,
  waitressStatus: 'idle',
  isWaitressVisible: false,

  setScreen: (screen) => set({ screen }),

  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString() + Math.random(), message, type }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  toggleAmbiance: () =>
    set((state) => {
      const next = !state.showAmbiance;
      localStorage.setItem('chkobba_ambiance', String(next));
      return { showAmbiance: next };
    }),

  toggleAmbianceSound: () =>
    set((state) => {
      const next = !state.ambianceSoundOn;
      localStorage.setItem('chkobba_ambiance_sound', String(next));
      return { ambianceSoundOn: next };
    }),

  setMusicVolume: (volume) => {
    localStorage.setItem('chkobba_music_volume', String(volume));
    set({ musicVolume: volume });
  },

  setWaitressStatus: (status) => set({ waitressStatus: status }),
  setWaitressVisible: (visible) => set({ isWaitressVisible: visible }),
}));

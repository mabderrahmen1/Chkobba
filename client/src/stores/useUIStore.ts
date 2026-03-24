import { create } from 'zustand';

export type Screen = 'landing' | 'createRoom' | 'joinRoom' | 'lobby' | 'game';
export type ToastType = 'info' | 'success' | 'error';
export type WaitressStatus = 'idle' | 'serving';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface UIStore {
  screen: Screen;
  showAmbiance: boolean;
  /** 0–1; multiplied with all SFX (cards, café props, etc.). Radio is separate. */
  soundEffectsVolume: number;
  soundEffectsMuted: boolean;
  toasts: ToastMessage[];
  waitressStatus: WaitressStatus;
  isWaitressVisible: boolean;
  isSubmitting: boolean;
  setScreen: (screen: Screen) => void;
  toggleAmbiance: () => void;
  setSoundEffectsVolume: (volume: number) => void;
  toggleSoundEffects: () => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setWaitressStatus: (status: WaitressStatus) => void;
  setWaitressVisible: (visible: boolean) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

// Check if we have a persisted session immediately on load
const getInitialScreen = (): Screen => {
  try {
    // Use sessionStorage so multiple tabs on localhost have independent sessions
    const raw = sessionStorage.getItem('chkobba-storage');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.state && data.state.roomId && data.state.playerId) {
        // If we have a session, start in 'lobby' as a loading state
        return 'lobby'; 
      }
    }
  } catch (e) {}
  return 'landing';
};

export const useUIStore = create<UIStore>((set) => ({
  screen: getInitialScreen(),
  showAmbiance: true,
  soundEffectsVolume: 1,
  soundEffectsMuted: false,
  toasts: [],
  waitressStatus: 'idle',
  isWaitressVisible: false,
  isSubmitting: false,

  setScreen: (screen) => set({ screen }),
  toggleAmbiance: () => set((state) => ({ showAmbiance: !state.showAmbiance })),
  setSoundEffectsVolume: (volume) =>
    set({
      soundEffectsVolume: Math.max(0, Math.min(1, volume)),
    }),
  toggleSoundEffects: () => set((state) => ({ soundEffectsMuted: !state.soundEffectsMuted })),

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setWaitressStatus: (waitressStatus) => set({ waitressStatus }),
  setWaitressVisible: (isWaitressVisible) => set({ isWaitressVisible }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
}));

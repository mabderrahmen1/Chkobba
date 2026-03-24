import { create } from 'zustand';

type Flash = { icon: string; label: string };

interface EmoteState {
  flashes: Record<string, Flash | undefined>;
  flashForPlayer: (playerId: string, icon: string, label: string, durationMs?: number) => void;
}

const clearTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useEmoteStore = create<EmoteState>((set) => ({
  flashes: {},

  flashForPlayer(playerId, icon, label, durationMs = 2000) {
    if (clearTimers[playerId]) {
      clearTimeout(clearTimers[playerId]);
      delete clearTimers[playerId];
    }

    set((s) => ({
      flashes: { ...s.flashes, [playerId]: { icon, label } },
    }));

    clearTimers[playerId] = setTimeout(() => {
      delete clearTimers[playerId];
      set((s) => {
        const next = { ...s.flashes };
        delete next[playerId];
        return { flashes: next };
      });
    }, durationMs);
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerStore {
  name: string;
  playerId: string;
  setName: (name: string) => void;
}

// Ensure the ID is truly persistent by generating it once and saving it
// outside of the standard Zustand lifecycle if needed.
const getOrCreatePlayerId = () => {
  const stored = localStorage.getItem('tab-arcade-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.playerId) {
        return parsed.state.playerId;
      }
    } catch (e) {
      // ignore parse errors
    }
  }
  // Generate random 8 character string
  return Math.random().toString(36).substring(2, 10);
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      name: '',
      playerId: getOrCreatePlayerId(),
      setName: (name) => set({ name }),
    }),
    {
      name: 'tab-arcade-storage', 
    }
  )
);
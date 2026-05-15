import { create } from "zustand";

interface GameStore {
  currentGameId: string | null;
  currentRound: number;
  isCommitted: boolean;
  isRevealed: boolean;
  salt: string | null;
  predictedValue: bigint | null;
  setCurrentGame: (id: string) => void;
  setCurrentRound: (round: number) => void;
  setIsCommitted: (val: boolean) => void;
  setIsRevealed: (val: boolean) => void;
  setSalt: (salt: string) => void;
  setPredictedValue: (val: bigint) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentGameId: null,
  currentRound: 0,
  isCommitted: false,
  isRevealed: false,
  salt: null,
  predictedValue: null,
  setCurrentGame: (id) => set({ currentGameId: id }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setIsCommitted: (val) => set({ isCommitted: val }),
  setIsRevealed: (val) => set({ isRevealed: val }),
  setSalt: (salt) => set({ salt }),
  setPredictedValue: (val) => set({ predictedValue: val }),
  reset: () =>
    set({
      currentGameId: null,
      currentRound: 0,
      isCommitted: false,
      isRevealed: false,
      salt: null,
      predictedValue: null,
    }),
}));

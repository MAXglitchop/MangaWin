import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HistoryState {
  clearTimestamp: number;
  deletedItems: Record<number, number>; // chapterId -> timestamp
  incognitoMode: boolean;
  clearHistory: () => void;
  removeChapterFromHistory: (chapterId: number) => void;
  toggleIncognitoMode: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      clearTimestamp: 0,
      deletedItems: {},
      incognitoMode: false,
      clearHistory: () => set({ clearTimestamp: Date.now(), deletedItems: {} }),
      removeChapterFromHistory: (chapterId) =>
        set((state) => ({
          deletedItems: {
            ...state.deletedItems,
            [chapterId]: Date.now(),
          },
        })),
      toggleIncognitoMode: () => set((state) => ({ incognitoMode: !state.incognitoMode })),
    }),
    {
      name: "mangawin-history-store",
    }
  )
);

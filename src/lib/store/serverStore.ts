import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ServerState {
  url: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  errorMessage: string | null;
  setUrl: (url: string) => void;
  setStatus: (status: ServerState["status"], error?: string) => void;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set) => ({
      url: "http://localhost:4567",
      status: "disconnected",
      errorMessage: null,
      setUrl: (url) => set({ url }),
      setStatus: (status, error) =>
        set({ status, errorMessage: error || null }),
    }),
    {
      name: "mangawin-server",
      partialize: (state) => ({ url: state.url }),
    }
  )
);

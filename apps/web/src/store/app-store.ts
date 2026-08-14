import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  apiToken: string | null;
  setApiToken: (token: string | null) => void;
}

/** Tema claro/escuro é controlado exclusivamente por next-themes (ThemeProvider / ecopet-theme). */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      apiToken: null,
      setApiToken: (apiToken) => set({ apiToken }),
    }),
    { name: "ecopet-store" }
  )
);

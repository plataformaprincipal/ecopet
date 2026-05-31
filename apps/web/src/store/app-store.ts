import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  apiToken: string | null;
  darkMode: boolean;
  setApiToken: (token: string | null) => void;
  setDarkMode: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      apiToken: null,
      darkMode: false,
      setApiToken: (apiToken) => set({ apiToken }),
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    { name: "ecopet-store" }
  )
);

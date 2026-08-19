"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ECOPET_THEME_STORAGE_KEY, ECOPET_THEMES } from "@/lib/theme/ecopet-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={[...ECOPET_THEMES]}
      storageKey={ECOPET_THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

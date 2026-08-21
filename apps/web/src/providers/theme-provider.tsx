"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ECOPET_THEME_STORAGE_KEY, ECOPET_THEMES } from "@/lib/theme/ecopet-theme";

/**
 * next-themes aplica `value` via classList.add/remove.
 * Cada valor DEVE ser um único token CSS. Espaço no valor gera
 * InvalidCharacterError e dispara global-error em toda a aplicação.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={[...ECOPET_THEMES]}
      value={{ light: "light", dark: "dark", black: "black", system: "system" }}
      storageKey={ECOPET_THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

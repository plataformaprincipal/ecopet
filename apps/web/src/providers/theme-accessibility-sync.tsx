"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { ECOPET_THEME_STORAGE_KEY, normalizeAppearanceTheme } from "@/lib/theme/ecopet-theme";

/**
 * Uma única preferência de tema (header + acessibilidade).
 * Migra `black` persistido para `dark`.
 */
export function ThemeAccessibilitySync() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const invertedContrast = useAccessibilityStore((s) => s.invertedContrast);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ECOPET_THEME_STORAGE_KEY);
      if (stored === "black" || theme === "black" || resolvedTheme === "black") {
        setTheme("dark");
      }
    } catch {
      /* storage indisponível */
    }
  }, [theme, resolvedTheme, setTheme]);

  useEffect(() => {
    if (invertedContrast && normalizeAppearanceTheme(resolvedTheme) !== "dark") {
      setTheme("dark");
    }
  }, [invertedContrast, resolvedTheme, setTheme]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { isEcopetAppearanceTheme } from "@/lib/theme/ecopet-theme";

/**
 * Mantém contraste invertido (legado) alinhado ao tema preto nativo — sem filter: invert.
 */
export function ThemeAccessibilitySync() {
  const { resolvedTheme, setTheme } = useTheme();
  const invertedContrast = useAccessibilityStore((s) => s.invertedContrast);

  useEffect(() => {
    if (invertedContrast && resolvedTheme !== "black") {
      setTheme("black");
    }
  }, [invertedContrast, resolvedTheme, setTheme]);

  useEffect(() => {
    if (!invertedContrast) return;
    if (isEcopetAppearanceTheme(resolvedTheme) && resolvedTheme !== "black") {
      useAccessibilityStore.setState({ invertedContrast: false });
    }
  }, [invertedContrast, resolvedTheme]);

  return null;
}

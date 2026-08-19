"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Circle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import {
  appearanceThemeActivatedKey,
  appearanceThemeLabelKey,
  cycleAppearanceTheme,
  isEcopetAppearanceTheme,
} from "@/lib/theme/ecopet-theme";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "md";
};

/**
 * Ciclo claro → escuro → preto com guard de montagem (evita mismatch de hidratação).
 */
export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const appearance =
    mounted && isEcopetAppearanceTheme(resolvedTheme) ? resolvedTheme : "light";

  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const labelKey = appearanceThemeLabelKey(appearance);
  const next = cycleAppearanceTheme(appearance);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-xl transition-colors duration-200",
        "hover:bg-ecopet-green/10 dark:hover:bg-white/10",
        className
      )}
      onClick={() => {
        setTheme(next);
      }}
      aria-label={t(labelKey)}
      title={t(labelKey)}
      disabled={!mounted}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <Sun
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            appearance === "light" ? "scale-100 rotate-0 opacity-100" : "scale-0 opacity-0"
          )}
          strokeWidth={2}
          aria-hidden
        />
        <Moon
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            appearance === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 opacity-0"
          )}
          strokeWidth={2}
          aria-hidden
        />
        <Circle
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            appearance === "black" ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
          strokeWidth={2}
          fill="currentColor"
          aria-hidden
        />
      </span>
      <span className="sr-only">{t(appearanceThemeActivatedKey(appearance))}</span>
    </Button>
  );
}

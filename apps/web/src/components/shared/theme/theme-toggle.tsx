"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import {
  cycleThemePreference,
  type EcopetTheme,
} from "@/lib/theme/ecopet-theme";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "md";
};

const LABEL_KEY: Record<EcopetTheme, "a11y.themeLight" | "a11y.themeDark" | "a11y.themeSystem"> = {
  light: "a11y.themeLight",
  dark: "a11y.themeDark",
  system: "a11y.themeSystem",
};

const ACTIVATED_KEY: Record<
  EcopetTheme,
  "a11y.themeLightActivated" | "a11y.themeDarkActivated" | "a11y.themeSystemActivated"
> = {
  light: "a11y.themeLightActivated",
  dark: "a11y.themeDarkActivated",
  system: "a11y.themeSystemActivated",
};

function normalizePreference(value: string | undefined): EcopetTheme {
  if (value === "dark" || value === "black") return "dark";
  if (value === "system") return "system";
  return "light";
}

/**
 * Ciclo claro → escuro → sistema. Mesma fonte de estado da acessibilidade (next-themes).
 */
export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const preference = mounted ? normalizePreference(theme) : "light";
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const next = cycleThemePreference(preference);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-xl transition-colors duration-200",
        "hover:bg-primary-muted",
        className
      )}
      onClick={() => {
        setTheme(next);
      }}
      aria-label={t(LABEL_KEY[preference])}
      title={t(LABEL_KEY[preference])}
      disabled={!mounted}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <Sun
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            preference === "light" ? "scale-100 rotate-0 opacity-100" : "scale-0 opacity-0"
          )}
          strokeWidth={2}
          aria-hidden
        />
        <Moon
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            preference === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 opacity-0"
          )}
          strokeWidth={2}
          aria-hidden
        />
        <Monitor
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            preference === "system" ? "scale-100 rotate-0 opacity-100" : "scale-0 opacity-0"
          )}
          strokeWidth={2}
          aria-hidden
        />
      </span>
      <span className="sr-only">{t(ACTIVATED_KEY[preference])}</span>
    </Button>
  );
}

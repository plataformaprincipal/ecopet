"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "md";
};

/**
 * Toggle Sol/Lua com guard de montagem para evitar mismatch de hidratação.
 */
export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

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
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("a11y.themeLight") : t("a11y.themeDark")}
      title={isDark ? t("a11y.themeLight") : t("a11y.themeDark")}
      disabled={!mounted}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <Sun
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
          strokeWidth={2}
          aria-hidden
        />
        <Moon
          className={cn(
            iconClass,
            "absolute transition-all duration-200",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
          )}
          strokeWidth={2}
          aria-hidden
        />
      </span>
    </Button>
  );
}

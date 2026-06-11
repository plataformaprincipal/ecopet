"use client";

import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppHeader({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-ecopet-gray/10 bg-white/90 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0d10]/90 lg:px-8">
      {title && (
        <h1 className="font-display text-lg font-bold text-ecopet-dark dark:text-white lg:text-xl">
          {title}
        </h1>
      )}
      <div className="ml-auto flex items-center gap-1">
        <div className="relative hidden max-w-xs md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" aria-hidden />
          <Input placeholder={t("common.search")} className="w-48 pl-10 lg:w-56" aria-label={t("common.search")} />
        </div>
        <NotificationBell variant="header" />
        <div className="hidden w-36 lg:block">
          <LanguageSelector compact />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationsStore } from "@/store/notifications-store";
import { useTranslation } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { formatNotificationTime, getCategoryConfig } from "@/lib/notifications/config";

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  label?: string;
  variant?: "nav" | "header" | "sidebar";
}

export function NotificationBell({
  className,
  iconClassName,
  showLabel = false,
  label,
  variant = "header",
}: NotificationBellProps) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const unread = useNotificationsStore((s) => s.unreadCount);
  const loaded = useNotificationsStore((s) => s.loaded);
  const notifications = useNotificationsStore((s) => s.notifications);
  const load = useNotificationsStore((s) => s.load);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  useEffect(() => {
    if (open && liveRef.current && unread > 0) {
      liveRef.current.textContent = t("notifications.unreadCount", { count: String(unread) });
    }
  }, [open, unread, t]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const recent = notifications.slice(0, 5);

  const badge = unread > 0 && (
    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ecopet-yellow px-1 text-[10px] font-bold text-ecopet-dark ring-2 ring-white dark:ring-[#0f1419]">
      {unread > 99 ? "99+" : unread}
    </span>
  );

  const triggerStyles = cn(
    "relative inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green",
    variant === "header" && "rounded-xl p-2 hover:bg-ecopet-green/10",
    variant === "sidebar" && "rounded-xl px-4 py-3 text-sm w-full text-ecopet-gray hover:bg-ecopet-green/5",
    variant === "nav" && "flex-col gap-0.5 px-2 py-1 text-[10px] font-medium text-ecopet-gray",
    className
  );

  return (
    <div ref={containerRef} className="relative">
      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      <button
        type="button"
        className={triggerStyles}
        aria-label={t("notifications.bellLabel", { count: String(unread) })}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative">
          <Bell className={cn("h-5 w-5", iconClassName)} aria-hidden />
          {badge}
        </span>
        {showLabel && <span>{label ?? t("nav.notifications")}</span>}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-xl border border-ecopet-gray/15 bg-white shadow-premium-lg dark:bg-[#0f1419]"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">{t("notifications.title")}</p>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => markAllAsRead()}>
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                {t("notifications.markAllRead")}
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("notifications.empty.description")}</p>
            ) : (
              recent.map((n) => {
                const config = getCategoryConfig(n.category);
                const Icon = config.icon;
                return (
                  <button
                    key={n.id}
                    type="button"
                    role="menuitem"
                    className={cn(
                      "flex w-full gap-3 border-b px-4 py-3 text-left transition hover:bg-muted/50",
                      !n.read && "bg-ecopet-green/[0.04]"
                    )}
                    onClick={() => {
                      if (!n.read) void markAsRead(n.id);
                      setOpen(false);
                      if (n.actionUrl) window.location.href = n.actionUrl;
                    }}
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                      <Icon className={cn("h-4 w-4", config.color)} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm", !n.read && "font-semibold")}>{n.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{n.description}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{formatNotificationTime(n.createdAt, locale)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t p-2">
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link href="/notificacoes" onClick={() => setOpen(false)}>
                {t("notifications.viewAll")}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

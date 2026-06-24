"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  Heart,
  MessageCircle,
  ShoppingBag,
  Calendar,
  PawPrint,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNotificationsStore } from "@/store/notifications-store";
import type { NotificationCategory } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<NotificationCategory, LucideIcon> = {
  orders: ShoppingBag,
  appointments: Calendar,
  social: Heart,
  messages: MessageCircle,
  adoption: PawPrint,
  campaigns: Megaphone,
  products: ShoppingBag,
  services: Calendar,
  security: Bell,
  system: Bell,
};

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  orders: "Pedidos",
  appointments: "Agendamentos",
  social: "Social",
  messages: "Mensagens",
  adoption: "Adoção",
  campaigns: "Campanhas",
  products: "Produtos",
  services: "Serviços",
  security: "Segurança",
  system: "Sistema",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function HubNotificationsPanel({ className }: { className?: string }) {
  const { notifications, unreadCount, loaded, loading, load, markAsRead } = useNotificationsStore();

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const grouped = useMemo(() => {
    const recent = [...notifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
    return recent;
  }, [notifications]);

  return (
    <section
      className={cn(
        "rounded-[20px] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60",
        className
      )}
      aria-label="Central de notificações"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <Bell className="h-5 w-5 text-ecopet-green" aria-hidden />
          Notificações
          {unreadCount > 0 ? (
            <span className="rounded-full bg-ecopet-green px-2 py-0.5 text-[11px] font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </h2>
        <Link href="/notificacoes" className="text-xs font-medium text-ecopet-green hover:underline">
          Ver tudo
        </Link>
      </header>

      {loading && grouped.length === 0 ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">Nenhuma notificação por enquanto.</p>
      ) : (
        <ul className="space-y-2">
          {grouped.map((n) => {
            const Icon = CATEGORY_ICON[n.category] ?? Bell;
            const href = n.actionUrl ?? n.action?.href ?? null;
            const className = cn(
              "flex items-start gap-3 rounded-xl border p-2.5 transition",
              n.read
                ? "border-transparent hover:bg-zinc-50 dark:hover:bg-white/5"
                : "border-ecopet-green/20 bg-ecopet-green/5"
            );
            const inner = (
              <>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ecopet-green/10">
                  <Icon className="h-4 w-4 text-ecopet-green" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-zinc-900 dark:text-white">{n.title}</span>
                    <span className="shrink-0 text-[10px] text-zinc-400">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-500">{n.description}</span>
                  <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-white/10">
                    {CATEGORY_LABEL[n.category]}
                  </span>
                </span>
                {!n.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ecopet-green" aria-label="Não lida" /> : null}
              </>
            );
            return (
              <li key={n.id}>
                {href ? (
                  <Link href={href} onClick={() => !n.read && void markAsRead(n.id)} className={className}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={() => !n.read && void markAsRead(n.id)} className={cn(className, "w-full text-left")}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

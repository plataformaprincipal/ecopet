"use client";

import Link from "next/link";
import { ShoppingCart, Bell, MessageSquare, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { SOCIAL_FILTERS, type SocialFilterId } from "./filters";

type SocialSidebarProps = {
  active: SocialFilterId;
  onSelect: (id: SocialFilterId) => void;
  className?: string;
};

const SHORTCUTS = [
  { href: "/carrinho", labelKey: "social.sidebar.cart", icon: ShoppingCart },
  { href: "/notificacoes", labelKey: "social.sidebar.notifications", icon: Bell },
  { href: "/dashboard/messages", labelKey: "social.sidebar.messages", icon: MessageSquare },
];

export function SocialSidebar({ active, onSelect, className }: SocialSidebarProps) {
  const { user } = useCurrentUser();
  const { t } = useTranslation();

  return (
    <aside className={cn("space-y-4", className)} aria-label={t("social.sidebarNav")}>
      {user ? (
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/50"
        >
          <Avatar className="h-11 w-11 ring-2 ring-ecopet-green/25">
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-ecopet-green">{t("social.sidebar.viewProfile")}</p>
          </div>
        </Link>
      ) : (
        <div className="rounded-3xl border border-zinc-200/70 bg-gradient-to-br from-ecopet-green to-emerald-700 p-4 text-white shadow-sm">
          <Sparkles className="h-6 w-6 text-ecopet-yellow" aria-hidden />
          <p className="mt-2 text-sm font-semibold">{t("social.sidebar.joinTitle")}</p>
          <p className="mt-1 text-xs text-white/85">{t("social.sidebar.joinDesc")}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/login" className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ecopet-dark">
              {t("social.topbar.signIn")}
            </Link>
            <Link href="/cadastro" className="rounded-lg border border-white/40 px-3 py-1.5 text-xs font-semibold">
              {t("social.topbar.createAccount")}
            </Link>
          </div>
        </div>
      )}

      <nav className="rounded-3xl border border-zinc-200/70 bg-white/70 p-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
        <ul>
          {SOCIAL_FILTERS.map((f) => {
            const selected = active === f.id;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelect(f.id)}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    selected
                      ? "bg-ecopet-green text-white shadow-sm shadow-ecopet-green/25"
                      : "text-zinc-600 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-white/5"
                  )}
                >
                  <f.icon className="h-5 w-5 shrink-0" aria-hidden />
                  {t(f.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
        <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("social.sidebar.shortcuts")}</h2>
        <ul>
          {SHORTCUTS.map((s) => (
            <li key={s.labelKey}>
              <Link
                href={s.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-zinc-600 transition hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                <s.icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(s.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

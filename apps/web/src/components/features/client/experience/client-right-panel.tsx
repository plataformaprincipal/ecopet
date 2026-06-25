"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, CalendarDays, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatDateTime } from "@/lib/i18n/format";
import { SuggestedProfilesPanel } from "@/components/features/social/ecopet-social/suggested-profiles-panel";
import type { ClientDashboardSummary } from "@/lib/client/dashboard-summary";

export function ClientRightPanel() {
  const { t, locale } = useTranslation();
  const [summary, setSummary] = useState<ClientDashboardSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/client/dashboard/summary", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setSummary(json.data.summary);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="hidden w-80 shrink-0 space-y-4 overflow-y-auto border-l border-zinc-200/80 bg-white/40 px-4 py-5 dark:border-white/10 dark:bg-zinc-950/40 xl:block">
      <section className="rounded-2xl border border-ecopet-green/20 bg-ecopet-green/[0.06] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-ecopet-green" aria-hidden />
          {t("clientArea.right.assistant")}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">{t("clientArea.right.assistantCta")}</p>
        <Link
          href="/client/eccopet"
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-ecopet-green px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ecopet-green/90"
        >
          {t("clientArea.right.openAssistant")}
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <CalendarDays className="h-4 w-4" aria-hidden />
          {t("clientArea.right.appointments")}
        </h3>
        {summary && summary.upcomingAppointments.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {summary.upcomingAppointments.slice(0, 3).map((a) => (
              <li key={a.id} className="text-xs">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{a.serviceName ?? "—"}</p>
                <p className="text-zinc-500">{formatDateTime(a.scheduledAt, locale)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">{t("clientArea.right.noAppointments")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <ShoppingCart className="h-4 w-4" aria-hidden />
          {t("clientArea.right.cart")}
        </h3>
        {summary && summary.cartItemsCount > 0 ? (
          <>
            <p className="mt-2 text-xs text-zinc-500">
              {t("clientArea.right.cartItems", { count: String(summary.cartItemsCount) })}
            </p>
            <Link
              href="/client/cart"
              className="mt-2 inline-flex text-xs font-semibold text-ecopet-green hover:underline"
            >
              {t("clientArea.right.goToCart")}
            </Link>
          </>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">{t("clientArea.right.cartEmpty")}</p>
        )}
      </section>

      <SuggestedProfilesPanel />
    </aside>
  );
}

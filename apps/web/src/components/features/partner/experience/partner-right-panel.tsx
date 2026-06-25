"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ShoppingBag, CalendarDays, PackageX, TrendingUp } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency, formatDateTime } from "@/lib/i18n/format";
import { translateOrderStatus } from "@/lib/i18n/enum-labels";
import type { PartnerDashboardSummary } from "@/lib/partner/ai-insights";

export function PartnerRightPanel() {
  const { t, locale } = useTranslation();
  const [summary, setSummary] = useState<PartnerDashboardSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/partner/dashboard/summary", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setSummary(json.data?.summary ?? null);
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
          {t("partnerArea.right.assistant")}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">{t("partnerArea.right.assistantCta")}</p>
        <Link
          href="/partner/eccopet"
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-ecopet-green px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ecopet-green/90"
        >
          {t("partnerArea.right.openAssistant")}
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {t("partnerArea.right.recentOrders")}
        </h3>
        {summary && summary.recentOrders.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {summary.recentOrders.slice(0, 3).map((o) => (
              <li key={o.id} className="text-xs">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {o.userName ?? "—"} · {formatCurrency(o.total, locale)}
                </p>
                <p className="text-zinc-500">{translateOrderStatus(t, o.status)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">{t("partnerArea.right.noOrders")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <CalendarDays className="h-4 w-4" aria-hidden />
          {t("partnerArea.right.upcomingAppointments")}
        </h3>
        {summary && summary.recentAppointments.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {summary.recentAppointments.slice(0, 3).map((a) => (
              <li key={a.id} className="text-xs">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{a.serviceName ?? "—"}</p>
                <p className="text-zinc-500">{formatDateTime(a.scheduledAt, locale)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">{t("partnerArea.right.noAppointments")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <PackageX className="h-4 w-4" aria-hidden />
          {t("partnerArea.right.lowStock")}
        </h3>
        {summary && summary.lowStockProducts.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {summary.lowStockProducts.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-xs">
                <span className="truncate text-zinc-800 dark:text-zinc-200">{p.name}</span>
                <span className="ml-2 shrink-0 font-semibold text-red-600">{p.stock}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">{t("partnerArea.right.noLowStock")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <TrendingUp className="h-4 w-4 text-ecopet-green" aria-hidden />
          {t("partnerArea.right.growthTip")}
        </h3>
        <p className="mt-2 text-xs text-zinc-500">{t("partnerArea.right.growthTipText")}</p>
      </section>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CalendarDays,
  Package,
  Scissors,
  Star,
  DollarSign,
  MessageSquare,
  PackageX,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency, formatDateTime } from "@/lib/i18n/format";
import { translateOrderStatus, translateAppointmentStatus } from "@/lib/i18n/enum-labels";
import type { PartnerDashboardSummary } from "@/lib/partner/ai-insights";

type Props = { businessName: string };

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ecopet-green/10">
        <Icon className="h-5 w-5 text-ecopet-green" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold text-zinc-900 dark:text-white">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

export function PartnerHomeDashboard({ businessName }: Props) {
  const { t, locale } = useTranslation();
  const [summary, setSummary] = useState<PartnerDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/partner/dashboard/summary", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setSummary(json.data?.summary ?? null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const firstName = businessName.split(" ")[0];
  const reviews = summary?.recentReviews ?? [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "—";
  const revenue = (summary?.recentOrders ?? []).reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-7">
      <header className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-900/[0.04] via-white to-white p-6 dark:border-white/10 dark:from-white/5 dark:via-zinc-900/60 dark:to-zinc-900/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ecopet-green">
          {t("partnerArea.home.title")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
          {t("partnerArea.home.greeting", { name: firstName })}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">{t("partnerArea.home.subtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/partner/eccopet"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ecopet-green px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-ecopet-green/90"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {t("partnerArea.home.openAi")}
          </Link>
          <Link
            href="/partner/products"
            className="inline-flex items-center rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            {t("partnerArea.home.manageProducts")}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label={t("partnerArea.home.stats.recentOrders")} value={summary?.stats.ordersCount ?? 0} />
        <StatCard icon={CalendarDays} label={t("partnerArea.home.stats.appointmentsPending")} value={summary?.stats.appointmentsPending ?? 0} />
        <StatCard icon={Package} label={t("partnerArea.home.stats.productsActive")} value={summary?.stats.productsActive ?? 0} />
        <StatCard icon={Scissors} label={t("partnerArea.home.stats.servicesActive")} value={summary?.stats.servicesActive ?? 0} />
        <StatCard icon={Star} label={t("partnerArea.home.stats.avgRating")} value={avgRating} />
        <StatCard icon={DollarSign} label={t("partnerArea.home.stats.revenue")} value={formatCurrency(revenue, locale)} />
        <StatCard icon={MessageSquare} label={t("partnerArea.home.stats.unreadMessages")} value={summary?.pendingMessages ?? 0} />
        <StatCard icon={PackageX} label={t("partnerArea.home.stats.lowStock")} value={summary?.lowStockProducts.length ?? 0} />
      </div>

      {/* Próximas ações (insights) */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t("partnerArea.home.nextActions")}
        </h2>
        {!summary || summary.insights.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("partnerArea.home.noActions")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.insights.map((insight) => (
              <Link
                key={insight.id}
                href={insight.actionHref ?? "/partner"}
                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white">{insight.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{insight.description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {t("partnerArea.home.recentOrders")}
          </h2>
          {!summary || summary.recentOrders.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("partnerArea.home.noOrders")}</p>
          ) : (
            summary.recentOrders.map((o) => (
              <Link
                key={o.id}
                href="/partner/orders"
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.userName ?? "—"}</span>
                  <span className="font-semibold">{formatCurrency(o.total, locale)}</span>
                </div>
                <p className="text-zinc-500">
                  {translateOrderStatus(t, o.status)} · {formatDateTime(o.createdAt, locale)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {t("partnerArea.home.recentAppointments")}
          </h2>
          {!summary || summary.recentAppointments.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("partnerArea.home.noAppointments")}</p>
          ) : (
            summary.recentAppointments.map((a) => (
              <Link
                key={a.id}
                href="/partner/appointments"
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.serviceName ?? "—"}</span>
                  <span className="text-xs text-zinc-500">{translateAppointmentStatus(t, a.status)}</span>
                </div>
                <p className="text-zinc-500">
                  {a.clientName ?? "—"} · {formatDateTime(a.scheduledAt, locale)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <PackageX className="h-4 w-4" aria-hidden />
            {t("partnerArea.home.lowStock")}
          </h2>
          {!summary || summary.lowStockProducts.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("partnerArea.home.noLowStock")}</p>
          ) : (
            summary.lowStockProducts.map((p) => (
              <Link
                key={p.id}
                href="/partner/products"
                className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <span className="truncate font-medium">{p.name}</span>
                <span className="ml-2 shrink-0 font-semibold text-red-600">{p.stock}</span>
              </Link>
            ))
          )}
        </section>
      </div>

      {loading ? <p className="sr-only">loading</p> : null}
    </div>
  );
}

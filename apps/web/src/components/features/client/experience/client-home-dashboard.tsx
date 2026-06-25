"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PawPrint,
  CalendarDays,
  MessageSquare,
  ShoppingCart,
  Sparkles,
  Package,
  Bell,
} from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency, formatDateTime } from "@/lib/i18n/format";
import { translateOrderStatus } from "@/lib/i18n/enum-labels";
import type { ClientDashboardSummary } from "@/lib/client/dashboard-summary";

type Props = { userName: string };

function StatCard({ icon: Icon, label, value }: { icon: typeof PawPrint; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ecopet-green/10">
        <Icon className="h-5 w-5 text-ecopet-green" aria-hidden />
      </span>
      <div>
        <p className="text-xl font-semibold text-zinc-900 dark:text-white">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

export function ClientHomeDashboard({ userName }: Props) {
  const { t, locale } = useTranslation();
  const [summary, setSummary] = useState<ClientDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/dashboard/summary", { credentials: "include" });
      const json = await res.json();
      if (json.success) setSummary(json.data.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = userName.split(" ")[0];
  const primaryPet = summary?.pets[0] ?? null;

  return (
    <div className="space-y-7">
      <header className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-ecopet-green/10 via-white to-white p-6 dark:border-white/10 dark:from-ecopet-green/10 dark:via-zinc-900/60 dark:to-zinc-900/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ecopet-green">
          {t("clientArea.home.title")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
          {t("clientArea.home.greeting", { name: firstName })}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">{t("clientArea.home.subtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/client/eccopet"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ecopet-green px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-ecopet-green/90"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {t("clientArea.home.openAi")}
          </Link>
          <Link
            href="/client/my-pet"
            className="inline-flex items-center rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            {t("clientArea.home.registerPet")}
          </Link>
          <Link
            href="/client/services"
            className="inline-flex items-center rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            {t("clientArea.home.bookService")}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={PawPrint} label={t("clientArea.home.stats.pets")} value={summary?.petsCount ?? 0} />
        <StatCard
          icon={CalendarDays}
          label={t("clientArea.home.stats.appointments")}
          value={summary?.upcomingAppointments.length ?? 0}
        />
        <StatCard icon={MessageSquare} label={t("clientArea.home.stats.messages")} value={summary?.unreadMessages ?? 0} />
        <StatCard icon={ShoppingCart} label={t("clientArea.home.stats.cart")} value={summary?.cartItemsCount ?? 0} />
      </div>

      {/* Pet card */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <PawPrint className="h-4 w-4 text-ecopet-green" aria-hidden />
          {t("clientArea.home.petCard")}
        </h2>
        {primaryPet ? (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{primaryPet.name}</p>
              <p className="text-sm text-zinc-500">{primaryPet.species}</p>
            </div>
            <Link href="/client/my-pet" className="text-sm font-semibold text-ecopet-green hover:underline">
              {t("clientArea.nav.myPet")}
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-500">{t("clientArea.home.noPet")}</p>
            <Link
              href="/client/my-pet"
              className="inline-flex items-center rounded-xl bg-ecopet-green px-3.5 py-2 text-sm font-semibold text-white"
            >
              {t("clientArea.home.registerPet")}
            </Link>
          </div>
        )}
      </section>

      {summary && summary.recommendations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            <Sparkles className="h-4 w-4" aria-hidden />
            {t("clientArea.home.recommendations")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={rec.href}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium text-zinc-900 dark:text-white">{rec.title}</p>
                <p className="mt-1 text-sm text-zinc-500">{rec.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <Bell className="h-4 w-4" aria-hidden />
            {t("clientArea.home.reminders")}
          </h2>
          {!summary || summary.upcomingReminders.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("clientArea.home.noReminders")}</p>
          ) : (
            summary.upcomingReminders.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{r.title}</p>
                <p className="text-zinc-500">
                  {r.petName} · {formatDateTime(r.dueAt, locale)}
                </p>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {t("clientArea.home.appointments")}
          </h2>
          {!summary || summary.upcomingAppointments.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("clientArea.home.noAppointments")}</p>
          ) : (
            summary.upcomingAppointments.map((a) => (
              <Link
                key={a.id}
                href="/client/appointments"
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{a.serviceName ?? "—"}</p>
                <p className="text-zinc-500">
                  {a.partnerName} · {formatDateTime(a.scheduledAt, locale)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <Package className="h-4 w-4" aria-hidden />
            {t("clientArea.home.orders")}
          </h2>
          {!summary || summary.recentOrders.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("clientArea.home.noOrders")}</p>
          ) : (
            summary.recentOrders.map((o) => (
              <Link
                key={o.id}
                href="/client/orders"
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{formatCurrency(o.total, locale)}</p>
                <p className="text-zinc-500">
                  {translateOrderStatus(t, o.status)} · {formatDateTime(o.createdAt, locale)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <MessageSquare className="h-4 w-4" aria-hidden />
            {t("clientArea.nav.messages")}
          </h2>
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
            <p className="text-2xl font-semibold">{summary?.unreadMessages ?? 0}</p>
            <p className="text-sm text-zinc-500">{t("clientArea.home.unread")}</p>
            <Link href="/client/messages" className="mt-2 inline-flex text-sm font-semibold text-ecopet-green hover:underline">
              {t("clientArea.home.openMessages")}
            </Link>
          </div>
        </section>
      </div>

      {loading ? <p className="sr-only">loading</p> : null}
    </div>
  );
}

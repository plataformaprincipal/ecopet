"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PawPrint,
  ShoppingBag,
  CalendarClock,
  BellRing,
  Sparkles,
  Lock,
  Stethoscope,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslateFn } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/i18n/format";
import { fetchPublicTrending, type PublicTrendingData } from "@/lib/public/client-api";
import { cn } from "@/lib/utils";

async function fetchJsonData<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T };
    if (!res.ok || body.success === false) return null;
    return (body.data ?? null) as T | null;
  } catch {
    return null;
  }
}

type OrderLite = { id: string; total?: number; createdAt: string; items?: { name?: string }[] };
type AppointmentLite = {
  id: string;
  scheduledAt: string;
  service?: { name?: string } | null;
  partner?: { name?: string; partnerProfile?: { businessName?: string } | null } | null;
};

function SectionShell({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof PawPrint;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
        <Icon className="h-4 w-4 text-ecopet-green" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}

function GuestContext({ t }: { t: TranslateFn }) {
  const blocks = [
    { icon: PawPrint, label: t("ecopetAi.context.blockPets") },
    { icon: ShoppingBag, label: t("ecopetAi.context.blockPurchases") },
    { icon: CalendarClock, label: t("ecopetAi.context.blockAppointments") },
    { icon: BellRing, label: t("ecopetAi.context.blockReminders") },
    { icon: Sparkles, label: t("ecopetAi.context.blockRecommendations") },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
      <div className="space-y-3" aria-hidden>
        {blocks.map((b) => (
          <div key={b.label} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 blur-[1.5px] dark:bg-white/5">
            <b.icon className="h-5 w-5 text-zinc-400" />
            <div className="h-3 flex-1 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 p-5 text-center backdrop-blur-sm dark:bg-zinc-900/60">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ecopet-green/10">
          <Lock className="h-6 w-6 text-ecopet-green" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t("ecopetAi.context.guestTitle")}</p>
        <p className="text-xs text-zinc-500">
          {t("ecopetAi.context.guestDesc")}
        </p>
        <div className="flex gap-2">
          <Link href="/login" className="rounded-xl bg-ecopet-green px-4 py-2 text-xs font-semibold text-white">
            {t("ecopetAi.context.signIn")}
          </Link>
          <Link href="/cadastro" className="rounded-xl border border-ecopet-green/40 px-4 py-2 text-xs font-semibold text-ecopet-green">
            {t("ecopetAi.context.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AIContextPanel({ className }: { className?: string }) {
  const { isAuthenticated } = useAuthGate();
  const { user } = useCurrentUser();
  const { t, locale } = useTranslation();
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [appointments, setAppointments] = useState<AppointmentLite[]>([]);
  const [trending, setTrending] = useState<PublicTrendingData | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchJsonData<{ orders: OrderLite[] }>("/api/orders/me").then((d) => setOrders(d?.orders?.slice(0, 3) ?? []));
    fetchJsonData<{ appointments: AppointmentLite[] }>("/api/appointments/me").then((d) =>
      setAppointments(d?.appointments ?? [])
    );
    fetchPublicTrending()
      .then(setTrending)
      .catch(() => setTrending(null));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className={cn("space-y-4", className)}>
        <GuestContext t={t} />
      </div>
    );
  }

  const upcoming = appointments
    .filter((a) => new Date(a.scheduledAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);
  const pets = user?.pets ?? [];
  const recProducts = trending?.featuredProducts?.slice(0, 3) ?? [];
  const recServices = trending?.featuredServices?.slice(0, 2) ?? [];

  return (
    <div className={cn("space-y-4", className)}>
      <SectionShell icon={PawPrint} title={t("ecopetAi.context.myPets")}>
        {pets.length === 0 ? (
          <Link href="/pets" className="text-xs text-ecopet-green">
            {t("ecopetAi.context.registerPet")}
          </Link>
        ) : (
          <ul className="space-y-1.5">
            {pets.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ecopet-green/10 text-ecopet-green">
                  <PawPrint className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="truncate">{p.name}</span>
                <span className="ml-auto text-[11px] text-zinc-400">{p.species}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionShell>

      <SectionShell icon={CalendarClock} title={t("ecopetAi.context.upcomingAppointments")}>
        {upcoming.length === 0 ? (
          <p className="text-xs text-zinc-400">{t("ecopetAi.context.noAppointments")}</p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((a) => (
              <li key={a.id} className="text-sm text-zinc-700 dark:text-zinc-200">
                <p className="truncate font-medium">{a.service?.name ?? t("ecopetAi.context.service")}</p>
                <p className="text-[11px] text-zinc-400">
                  {formatDateTime(a.scheduledAt, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionShell>

      <SectionShell icon={ShoppingBag} title={t("ecopetAi.context.recentPurchases")}>
        {orders.length === 0 ? (
          <p className="text-xs text-zinc-400">{t("ecopetAi.context.noPurchases")}</p>
        ) : (
          <ul className="space-y-1.5">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <span className="truncate">{o.items?.[0]?.name ?? `${t("ecopetAi.context.order")} #${o.id.slice(0, 6)}`}</span>
                {typeof o.total === "number" ? (
                  <span className="shrink-0 text-[11px] text-zinc-400">{formatCurrency(o.total, locale)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionShell>

      <SectionShell icon={Sparkles} title={t("ecopetAi.context.recommended")}>
        {recProducts.length === 0 && recServices.length === 0 ? (
          <p className="text-xs text-zinc-400">{t("ecopetAi.context.noRecommended")}</p>
        ) : (
          <ul className="space-y-1.5">
            {recProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/marketplace/produto/${p.id}`} className="truncate text-zinc-700 hover:text-ecopet-green dark:text-zinc-200">
                  {p.name}
                </Link>
                <span className="shrink-0 text-[11px] text-zinc-400">{formatCurrency(p.price, locale)}</span>
              </li>
            ))}
            {recServices.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-ecopet-green" aria-hidden />
                <span className="truncate">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionShell>
    </div>
  );
}

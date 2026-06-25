"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/i18n/format";

type Customer = {
  userId: string;
  name: string;
  since: string;
  ordersCount: number;
  appointmentsCount: number;
  totalSpent: number;
  lastInteraction: string;
};

export function PartnerCustomersList() {
  const { t, locale } = useTranslation();
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/partner/customers", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setCustomers(json.data.customers);
      })
      .catch(() => {
        if (active) setCustomers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
        {t("partnerArea.customers.title")}
      </h1>

      {customers === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900/60">
          <Users className="mx-auto h-10 w-10 text-zinc-300" aria-hidden />
          <p className="mt-3 text-sm text-zinc-500">{t("partnerArea.customers.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {customers.map((c) => {
            const initials = c.name
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase();
            return (
              <li
                key={c.userId}
                className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ecopet-green/15 text-sm font-semibold text-ecopet-green">
                  {initials || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-zinc-500">
                    {c.ordersCount} {t("partnerArea.customers.orders")} · {c.appointmentsCount}{" "}
                    {t("partnerArea.customers.appointments")} · {t("partnerArea.customers.since")}{" "}
                    {formatDate(c.since, locale)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {t("partnerArea.customers.lastInteraction")}: {formatDateTime(c.lastInteraction, locale)}
                  </p>
                </div>
                {c.totalSpent > 0 ? (
                  <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-white">
                    {formatCurrency(c.totalSpent, locale)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

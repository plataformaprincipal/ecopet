"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency, formatDateTime } from "@/lib/i18n/format";
import { translateOrderStatus } from "@/lib/i18n/enum-labels";

type OrderItem = { id: string; name: string; quantity: number; price: number };
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

export function ClientOrdersList() {
  const { t, locale } = useTranslation();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/client/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setOrders(json.data.orders);
      })
      .catch(() => {
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
        {t("clientArea.sections.orders")}
      </h1>

      {orders === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900/60">
          <Package className="mx-auto h-10 w-10 text-zinc-300" aria-hidden />
          <p className="mt-3 text-sm text-zinc-500">{t("clientArea.orders.empty")}</p>
          <Link
            href="/client/marketplace"
            className="mt-4 inline-flex items-center rounded-xl bg-ecopet-green px-4 py-2 text-sm font-semibold text-white"
          >
            {t("clientArea.orders.goShopping")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white">#{order.orderNumber}</p>
                  <p className="text-xs text-zinc-500">
                    {t("clientArea.orders.placedOn")} {formatDateTime(order.createdAt, locale)} ·{" "}
                    {order.items.length} {t("clientArea.orders.items")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                  {translateOrderStatus(t, order.status)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-white/10">
                <span className="text-sm text-zinc-500">{t("clientArea.orders.total")}</span>
                <span className="text-base font-semibold text-zinc-900 dark:text-white">
                  {formatCurrency(order.total, locale)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

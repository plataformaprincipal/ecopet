"use client";

import { useEffect, useState } from "react";
import { HandHeart, Check } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatDateTime } from "@/lib/i18n/format";

type Supporter = {
  userId: string;
  name: string;
  follows: boolean;
  adoptionRequests: number;
  lastInteraction: string;
};

export function NgoSupportersList() {
  const { t, locale } = useTranslation();
  const [supporters, setSupporters] = useState<Supporter[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/ong/supporters", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setSupporters(json.data.supporters);
      })
      .catch(() => {
        if (active) setSupporters([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
        {t("ngoArea.supporters.title")}
      </h1>

      {supporters === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
          ))}
        </div>
      ) : supporters.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900/60">
          <HandHeart className="mx-auto h-10 w-10 text-zinc-300" aria-hidden />
          <p className="mt-3 text-sm text-zinc-500">{t("ngoArea.supporters.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {supporters.map((s) => {
            const initials = s.name
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase();
            return (
              <li
                key={s.userId}
                className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-sm font-semibold text-rose-600">
                  {initials || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900 dark:text-white">{s.name}</p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {s.follows ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <Check className="h-3 w-3" aria-hidden />
                        {t("ngoArea.supporters.follows")}
                      </span>
                    ) : null}
                    {s.adoptionRequests > 0 ? (
                      <span>
                        {s.adoptionRequests} {t("ngoArea.supporters.requests")}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {t("ngoArea.supporters.lastInteraction")}: {formatDateTime(s.lastInteraction, locale)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

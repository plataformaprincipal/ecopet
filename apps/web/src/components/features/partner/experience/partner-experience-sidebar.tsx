"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import type { PartnerAccessLevel } from "@/lib/partner/access";
import {
  PARTNER_EXPERIENCE_NAV,
  isPartnerExperienceNavActive,
} from "@/lib/partner/experience-nav";

type Props = {
  businessName: string;
  accessLevel: PartnerAccessLevel;
  statusLabel: string;
  statusTone: "pending" | "approved" | "suspended" | "rejected";
};

const TONE: Record<Props["statusTone"], string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  suspended: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export function PartnerExperienceSidebar({ businessName, accessLevel, statusLabel, statusTone }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 lg:flex">
      <div className="border-b border-zinc-200/80 px-5 py-5 dark:border-white/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {t("partnerArea.area")}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Store className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="min-w-0 flex-1 truncate font-display text-base font-semibold text-zinc-900 dark:text-white">
            {businessName}
          </h2>
        </div>
        <span className={cn("mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", TONE[statusTone])}>
          {statusLabel}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label={t("partnerArea.area")}>
        {PARTNER_EXPERIENCE_NAV.map((item) => {
          const active = isPartnerExperienceNavActive(pathname, item.href);
          const locked = item.requiresApproval && accessLevel !== "full";
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{t(item.labelKey)}</span>
              {locked ? <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden /> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

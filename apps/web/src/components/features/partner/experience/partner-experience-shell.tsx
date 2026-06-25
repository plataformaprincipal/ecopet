"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Plus, Sparkles, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import type { PartnerAccessLevel } from "@/lib/partner/access";
import {
  PARTNER_EXPERIENCE_NAV,
  PARTNER_IMMERSIVE_ROUTES,
  PARTNER_RIGHT_PANEL_ROUTES,
  isPartnerExperienceNavActive,
  partnerExperienceRouteRequiresApproval,
} from "@/lib/partner/experience-nav";
import { PartnerExperienceSidebar } from "./partner-experience-sidebar";
import { PartnerBottomNav } from "./partner-bottom-nav";
import { PartnerTopbar } from "./partner-topbar";
import { PartnerRightPanel } from "./partner-right-panel";

type StatusTone = "pending" | "approved" | "suspended" | "rejected";

const STATUS_LABEL_KEY: Record<StatusTone, string> = {
  pending: "partnerArea.status.pending",
  approved: "partnerArea.status.approved",
  suspended: "partnerArea.status.suspended",
  rejected: "partnerArea.status.rejected",
};

type Props = {
  businessName: string;
  accessLevel: PartnerAccessLevel;
  statusTone: StatusTone;
  children: React.ReactNode;
};

export function PartnerExperienceShell({
  businessName,
  accessLevel,
  statusTone,
  children,
}: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const statusLabel = t(STATUS_LABEL_KEY[statusTone]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const immersive = PARTNER_IMMERSIVE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const showRightPanel = PARTNER_RIGHT_PANEL_ROUTES.includes(pathname);
  const limited = accessLevel !== "full";
  const routeLocked = limited && partnerExperienceRouteRequiresApproval(pathname);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PartnerExperienceSidebar
        businessName={businessName}
        accessLevel={accessLevel}
        statusLabel={statusLabel}
        statusTone={statusTone}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <PartnerTopbar businessName={businessName} onMenuClick={() => setMenuOpen(true)} />

        <div className="flex min-h-0 flex-1">
          <main
            className={cn(
              "min-w-0 flex-1 pb-24 lg:pb-6",
              immersive ? "" : "mx-auto w-full max-w-5xl px-4 py-6"
            )}
          >
            {limited ? (
              <div
                className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
                role="status"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
                  <div>
                    <p className="font-medium">{t("partnerArea.pending.title")}</p>
                    <p className="mt-0.5 text-amber-800/90 dark:text-amber-100/80">
                      {t("partnerArea.pending.description")}
                    </p>
                  </div>
                </div>
                <Link
                  href="/partner/profile"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  {t("partnerArea.pending.cta")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            ) : null}

            {routeLocked ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200/80 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-zinc-900/60">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10">
                  <Lock className="h-6 w-6 text-zinc-400" aria-hidden />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold text-zinc-900 dark:text-white">
                  {t("partnerArea.locked.title")}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-zinc-500">{t("partnerArea.locked.description")}</p>
                <Link
                  href="/partner/profile"
                  className="mt-5 inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
                >
                  {t("partnerArea.locked.cta")}
                </Link>
              </div>
            ) : (
              children
            )}
          </main>
          {showRightPanel && !routeLocked ? <PartnerRightPanel /> : null}
        </div>
      </div>

      <PartnerBottomNav />

      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 lg:hidden">
        <Link
          href="/partner/eccopet"
          aria-label={t("partnerArea.shell.ai")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </Link>
        <Link
          href="/partner/products/new"
          aria-label={t("partnerArea.shell.newProduct")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg dark:bg-white dark:text-zinc-900"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </Link>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-white shadow-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-4 dark:border-white/10">
              <span className="truncate font-display text-base font-semibold text-zinc-900 dark:text-white">
                {businessName}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {PARTNER_EXPERIENCE_NAV.map((item) => {
                const active = isPartnerExperienceNavActive(pathname, item.href);
                const locked = item.requiresApproval && limited;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

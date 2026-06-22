"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PartnerAccessLevel } from "@/lib/partner/access";
import { canAccessPartnerRoute } from "@/lib/partner/access";
import { PartnerSidebar } from "./partner-sidebar";
import { PartnerMobileNav } from "./partner-mobile-nav";
import { PartnerPendingBanner } from "./partner-pending-banner";
import { PartnerLockedScreen } from "./partner-locked-screen";

export type PartnerShellContext = {
  userId: string;
  businessName: string;
  accountStatus: string;
  verificationStatus?: string | null;
  accessLevel: PartnerAccessLevel;
};

type PartnerShellProps = PartnerShellContext & {
  children: ReactNode;
};

export function PartnerShell({
  children,
  businessName,
  accountStatus,
  verificationStatus,
  accessLevel,
}: PartnerShellProps) {
  const pathname = usePathname();
  const allowed = canAccessPartnerRoute(pathname, accessLevel);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PartnerSidebar
        businessName={businessName}
        accessLevel={accessLevel}
        accountStatus={accountStatus}
        verificationStatus={verificationStatus}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-zinc-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Parceiro EcoPet
          </p>
          <p className="truncate font-display text-base font-semibold text-zinc-900 dark:text-white">
            {businessName}
          </p>
        </div>

        <main
          className={cn(
            "mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-8",
            "animate-in fade-in duration-300"
          )}
        >
          <PartnerPendingBanner accessLevel={accessLevel} className="mb-6" />
          {allowed ? children : <PartnerLockedScreen />}
        </main>
      </div>

      <PartnerMobileNav accessLevel={accessLevel} />
    </div>
  );
}

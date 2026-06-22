"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { OngAccessLevel } from "@/lib/ong/access";
import { canAccessOngRoute } from "@/lib/ong/access";
import { OngSidebar } from "./ong-sidebar";
import { OngMobileNav } from "./ong-mobile-nav";
import { OngPendingBanner } from "./ong-pending-banner";
import { OngLockedScreen } from "./ong-locked-screen";

export type OngShellContext = {
  userId: string;
  ongName: string;
  accountStatus: string;
  verificationStatus?: string | null;
  accessLevel: OngAccessLevel;
};

type OngShellProps = OngShellContext & {
  children: ReactNode;
};

export function OngShell({
  children,
  ongName,
  accountStatus,
  verificationStatus,
  accessLevel,
}: OngShellProps) {
  const pathname = usePathname();
  const allowed = canAccessOngRoute(pathname, accessLevel);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <OngSidebar
        ongName={ongName}
        accessLevel={accessLevel}
        accountStatus={accountStatus}
        verificationStatus={verificationStatus}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-zinc-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            ONG / Protetor EcoPet
          </p>
          <p className="truncate font-display text-base font-semibold text-zinc-900 dark:text-white">
            {ongName}
          </p>
        </div>

        <main
          className={cn(
            "mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-8",
            "animate-in fade-in duration-300"
          )}
        >
          <OngPendingBanner accessLevel={accessLevel} className="mb-6" />
          {allowed ? children : <OngLockedScreen accessLevel={accessLevel} />}
        </main>
      </div>

      <OngMobileNav accessLevel={accessLevel} />
    </div>
  );
}

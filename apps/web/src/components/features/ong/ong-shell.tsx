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
    <div className="flex min-h-screen bg-ecopet-cream/50 dark:bg-ecopet-dark-bg">
      <OngSidebar
        ongName={ongName}
        accessLevel={accessLevel}
        accountStatus={accountStatus}
        verificationStatus={verificationStatus}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="glass sticky top-0 z-30 border-b border-ecopet-gray/10 px-4 py-3 lg:hidden dark:border-white/10">
          <p className="overline-text text-ecopet-gray/70">ONG EcoPet</p>
          <p className="truncate font-display text-base font-semibold text-ecopet-dark dark:text-white">
            {ongName}
          </p>
        </div>

        <main
          className={cn(
            "mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10",
            "animate-fade-in"
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

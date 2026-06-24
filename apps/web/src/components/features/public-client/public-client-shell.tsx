"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PublicNavbar } from "./public-navbar";
import { PublicMobileNav } from "./public-mobile-nav";
import { cn } from "@/lib/utils";

type PublicClientShellProps = {
  children: ReactNode;
};

export function PublicClientShell({ children }: PublicClientShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-ecopet-dark-bg">
      <PublicNavbar />
      <main
        className={cn(
          "flex-1",
          isHome ? "pb-28" : "mx-auto w-full max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:pb-8"
        )}
      >
        {children}
      </main>
      <PublicMobileNav />
    </div>
  );
}

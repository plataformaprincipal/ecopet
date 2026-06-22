"use client";

import type { ReactNode } from "react";
import { PublicNavbar } from "./public-navbar";
import { PublicMobileNav } from "./public-mobile-nav";

type PublicClientShellProps = {
  children: ReactNode;
};

export function PublicClientShell({ children }: PublicClientShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:pb-8">
        {children}
      </main>
      <PublicMobileNav />
    </div>
  );
}

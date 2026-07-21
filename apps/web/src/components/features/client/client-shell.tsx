"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ClientSidebar } from "./client-sidebar";
import { ClientMobileNav } from "./client-mobile-nav";

type ClientShellProps = {
  userName: string;
  children: ReactNode;
};

export function ClientShell({ userName, children }: ClientShellProps) {
  return (
    <div className="flex min-h-screen bg-ecopet-cream/50 dark:bg-ecopet-dark-bg">
      <ClientSidebar userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="glass sticky top-0 z-30 border-b border-ecopet-gray/10 px-4 py-3 lg:hidden dark:border-white/10">
          <p className="overline-text text-ecopet-gray/70">EcoPet</p>
          <p className="truncate font-display text-base font-semibold text-ecopet-dark dark:text-white">
            Olá, {userName.split(" ")[0]}
          </p>
        </div>
        <main
          className={cn(
            "mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8",
            "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-10",
            "animate-fade-in"
          )}
        >
          {children}
        </main>
      </div>
      <ClientMobileNav />
    </div>
  );
}

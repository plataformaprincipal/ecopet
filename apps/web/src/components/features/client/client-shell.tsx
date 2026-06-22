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
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ClientSidebar userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-zinc-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            EcoPet Cliente
          </p>
          <p className="truncate font-display text-base font-semibold text-zinc-900 dark:text-white">
            Olá, {userName.split(" ")[0]}
          </p>
        </div>
        <main
          className={cn(
            "mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-8",
            "animate-in fade-in duration-300"
          )}
        >
          {children}
        </main>
      </div>
      <ClientMobileNav />
    </div>
  );
}

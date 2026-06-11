"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { MainNavigation } from "@/components/navigation/main-navigation";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { EcopetAIAssistant } from "@/components/ai/ecopet-ai-assistant";
import { PublicAppBar } from "@/components/layout/public-app-bar";
import { isPublicMarketplacePath } from "@/lib/auth/routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const isGuestMarketplace = status === "unauthenticated" && isPublicMarketplacePath(pathname);

  if (isGuestMarketplace) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-ecopet-dark-bg">
        <PublicAppBar />
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-ecopet-dark-bg">
      <MainNavigation />
      <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <BottomNav />
      <EcopetAIAssistant />
    </div>
  );
}

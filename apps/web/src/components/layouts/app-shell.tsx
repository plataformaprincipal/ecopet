"use client";

import { usePathname } from "next/navigation";
import { MainNavigation } from "@/components/shared/navigation/main-navigation";
import { BottomNav } from "@/components/shared/navigation/bottom-nav";
import { EcopetAIAssistant } from "@/components/features/ai/ecopet-ai-assistant";
import { PublicAppBar } from "@/components/layouts/public-app-bar";
import { isPublicClientPath, isPublicMarketplacePath } from "@/lib/auth/routes";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { getNavigationMode } from "@/lib/navigation/secure-nav";
import { isPublicClientShellPath } from "@/lib/public-client/nav";
import { isClientAreaPath } from "@/lib/client/nav";
import { isOngAreaPath } from "@/lib/ong/nav";
import { PublicClientShell } from "@/components/features/public-client/public-client-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, loading } = useFoundationSession();
  const mode = getNavigationMode(loading, role);

  const usePublicShell =
    isPublicMarketplacePath(pathname) && mode === "unauthenticated";

  const usePublicClientShell =
    mode === "unauthenticated" &&
    (isPublicClientShellPath(pathname) || isPublicClientPath(pathname)) &&
    pathname !== "/";

  if (usePublicClientShell) {
    return (
      <PublicClientShell>{children}</PublicClientShell>
    );
  }

  if (usePublicShell) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-ecopet-dark-bg">
        <PublicAppBar />
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return <FoundationAppShell role={role}>{children}</FoundationAppShell>;
}

function FoundationAppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: ReturnType<typeof useFoundationSession>["role"];
}) {
  const pathname = usePathname();
  const isPartnerArea = pathname.startsWith("/parceiro");
  const isClientArea = isClientAreaPath(pathname);
  const isOngArea = isOngAreaPath(pathname);
  const isSocialHub = pathname === "/feed" || pathname === "/social";
  const showAi = role === "CLIENT";

  if (isPartnerArea || isClientArea || isOngArea) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Social Hub: full-width 3-column experience owns its own left navigation.
  if (isSocialHub) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-ecopet-dark-bg">
        <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>
        <BottomNav />
        {showAi && <EcopetAIAssistant />}
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
      {showAi && <EcopetAIAssistant />}
    </div>
  );
}

"use client";

import { PrimaryBottomNav } from "@/components/shared/navigation/primary-bottom-nav";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { getNavigationMode } from "@/lib/navigation/secure-nav";

/**
 * Bottom nav compartilhada (fora de shells de role).
 * Desktop: oculto (lg:hidden). Mobile: exatamente 5 itens.
 * Logout fica no Perfil / menu de conta — não na barra principal.
 */
export function BottomNav() {
  const { role, loading } = useFoundationSession();
  const mode = getNavigationMode(loading, role);

  if (mode === "loading") return null;

  const context =
    role === "CLIENT" ? "clientPt" : mode === "unauthenticated" ? "public" : "public";

  return <PrimaryBottomNav context={context} />;
}

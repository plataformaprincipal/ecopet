"use client";

import { useEffect, useRef } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { useSocialStore } from "@/store/social-store";
import { useNotificationsStore } from "@/store/notifications-store";

/** Reidrata stores por usuário quando a sessão EcoPet muda. */
export function AuthTokenSync() {
  const { data: session, status } = useAuthSession();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id ?? null;

    if (status === "unauthenticated") {
      lastUserId.current = null;
      return;
    }

    if (!userId || userId === lastUserId.current) return;
    lastUserId.current = userId;

    useMarketplaceStore.persist.setOptions({ name: `ecopet-marketplace-${userId}` });
    void useMarketplaceStore.persist.rehydrate();

    useSocialStore.getState().resetForUser();
    useNotificationsStore.getState().resetForUser();
  }, [session?.user?.id, status]);

  return null;
}

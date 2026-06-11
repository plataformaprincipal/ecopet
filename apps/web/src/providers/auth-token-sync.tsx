"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/store/app-store";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { useSocialStore } from "@/store/social-store";
import { useNotificationsStore } from "@/store/notifications-store";

/** Mantém apiToken do Zustand alinhado com a sessão NextAuth após login. */
export function AuthTokenSync() {
  const { data: session, status } = useSession();
  const setApiToken = useAppStore((s) => s.setApiToken);
  const storeToken = useAppStore((s) => s.apiToken);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const sessionToken = (session as { apiToken?: string } | null)?.apiToken;
    if (sessionToken && sessionToken !== storeToken) {
      setApiToken(sessionToken);
    }
  }, [session, storeToken, setApiToken]);

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

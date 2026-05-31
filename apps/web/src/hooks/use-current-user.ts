"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  username?: string;
  accountStatus?: string;
  isBootstrapUser?: boolean;
  isMasterAdmin?: boolean;
  isOrgAdmin?: boolean;
  mustChangePassword?: boolean;
  firstLoginRequired?: boolean;
  isPremium: boolean;
  isVerified: boolean;
  pets: { id: string; name: string; photo: string | null; species: string }[];
  gamification?: { points: number; level: number } | null;
}

export function useCurrentUser() {
  const { data: session, status: sessionStatus } = useSession();
  const storeToken = useAppStore((s) => s.apiToken);
  const setApiToken = useAppStore((s) => s.setApiToken);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionToken = session?.apiToken;
  const token = storeToken || sessionToken || null;

  useEffect(() => {
    setHydrated(useAppStore.persist.hasHydrated());
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (sessionToken && !storeToken) {
      setApiToken(sessionToken);
    }
  }, [sessionToken, storeToken, setApiToken]);

  useEffect(() => {
    if (!hydrated || sessionStatus === "loading") return;

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api<CurrentUser>("/api/users/me", { token })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [token, hydrated, sessionStatus]);

  return { user, loading: loading || !hydrated || sessionStatus === "loading", token };
}

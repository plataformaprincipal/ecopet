"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  cpf?: string;
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
  address?: {
    street: string;
    number: string;
    complement?: string | null;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

export function useCurrentUser() {
  const { status: sessionStatus } = useAuthSession();
  const storeToken = useAppStore((s) => s.apiToken);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const token = storeToken || null;

  useEffect(() => {
    setHydrated(useAppStore.persist.hasHydrated());
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated || sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api<CurrentUser>("/api/users/me", token ? { token } : undefined)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [token, hydrated, sessionStatus]);

  return { user, loading: loading || !hydrated || sessionStatus === "loading", token };
}

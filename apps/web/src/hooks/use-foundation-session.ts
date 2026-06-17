"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AccountStatus } from "@prisma/client";
import { SESSION_CHANGED_EVENT } from "@/lib/auth/session-events";
import type { AppRole } from "@/lib/permissions";

type FoundationSession = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  accountStatus: AccountStatus;
};

async function fetchFoundationSession(): Promise<FoundationSession | null> {
  const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  if (data?.success === false || !data?.data?.user) return null;

  return data.data.user as FoundationSession;
}

export function useFoundationSession() {
  const pathname = usePathname();
  const [user, setUser] = useState<FoundationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const hasResolvedOnce = useRef(false);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      setUser(await fetchFoundationSession());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      hasResolvedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isInitialLoad = !hasResolvedOnce.current;

    (async () => {
      if (isInitialLoad) setLoading(true);
      try {
        const sessionUser = await fetchFoundationSession();
        if (!cancelled) setUser(sessionUser);
      } catch {
        if (!cancelled && isInitialLoad) setUser(null);
      } finally {
        if (!cancelled) {
          if (isInitialLoad) setLoading(false);
          hasResolvedOnce.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const onSessionChanged = () => {
      void refreshUser();
    };
    window.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged);
  }, [refreshUser]);

  return {
    user,
    role: user?.role ?? null,
    accountStatus: user?.accountStatus ?? null,
    isAuthenticated: !!user,
    loading,
    refreshUser,
  };
}

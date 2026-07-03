"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { SESSION_CHANGED_EVENT } from "@/lib/auth/session-events";
import {
  fetchAuthSession,
  type AuthSessionData,
  type SessionStatus,
} from "@/lib/auth/fetch-session";

type AuthSessionContextValue = {
  data: AuthSessionData | null;
  status: SessionStatus;
  refresh: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<AuthSessionData | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const hasResolvedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!hasResolvedOnce.current) setStatus("loading");
    const session = await fetchAuthSession();
    setData(session);
    setStatus(session ? "authenticated" : "unauthenticated");
    hasResolvedOnce.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isInitial = !hasResolvedOnce.current;

    (async () => {
      if (isInitial) setStatus("loading");
      const session = await fetchAuthSession();
      if (cancelled) return;
      setData(session);
      setStatus(session ? "authenticated" : "unauthenticated");
      hasResolvedOnce.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const onChanged = () => {
      void refresh();
    };
    window.addEventListener(SESSION_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onChanged);
  }, [refresh]);

  const value = useMemo(
    () => ({ data, status, refresh }),
    [data, status, refresh]
  );

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSessionContext(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}

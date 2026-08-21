"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AuthRequiredModal } from "@/components/features/social/feed/auth-required-modal";

type AuthGateContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  requireAuth: (action?: () => void) => boolean;
  openAuthModal: () => void;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuthSession();
  const [open, setOpen] = useState(false);
  const queuedAction = useRef<(() => void) | null>(null);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const openAuthModal = useCallback(() => setOpen(true), []);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (isLoading) {
        queuedAction.current = action ?? null;
        return false;
      }
      if (isAuthenticated) {
        action?.();
        return true;
      }
      queuedAction.current = null;
      setOpen(true);
      return false;
    },
    [isAuthenticated, isLoading]
  );

  if (!isLoading && isAuthenticated && queuedAction.current) {
    const next = queuedAction.current;
    queuedAction.current = null;
    queueMicrotask(() => next());
  }

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, requireAuth, openAuthModal }),
    [isAuthenticated, isLoading, requireAuth, openAuthModal]
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <AuthRequiredModal open={open} onOpenChange={setOpen} />
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider");
  return ctx;
}

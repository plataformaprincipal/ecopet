"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const openAuthModal = useCallback(() => setOpen(true), []);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (isAuthenticated) {
        action?.();
        return true;
      }
      setOpen(true);
      return false;
    },
    [isAuthenticated]
  );

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

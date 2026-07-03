"use client";

import { useCallback } from "react";
import type { AccountStatus } from "@prisma/client";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { AppRole } from "@/lib/permissions";

type FoundationSession = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  accountStatus: AccountStatus;
};

/** Sessão foundation — reutiliza AuthSessionProvider (sem fetch duplicado em /api/auth/me). */
export function useFoundationSession() {
  const { data, status, update } = useAuthSession();

  const user: FoundationSession | null = data?.user
    ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as AppRole,
        accountStatus: (data.user.accountStatus ?? "ACTIVE") as AccountStatus,
      }
    : null;

  const refreshUser = useCallback(async () => {
    await update();
  }, [update]);

  return {
    user,
    role: user?.role ?? null,
    accountStatus: user?.accountStatus ?? null,
    isAuthenticated: !!user,
    loading: status === "loading",
    refreshUser,
  };
}

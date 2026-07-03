"use client";

import { useAuthSessionContext } from "@/providers/auth-session-provider";

export type { AuthSessionData, AuthSessionUser, SessionStatus } from "@/lib/auth/fetch-session";

/** Sessão EcoPet (cookie ecopet-session) — substituto do useSession do NextAuth. */
export function useAuthSession() {
  const { data, status, refresh } = useAuthSessionContext();
  return { data, status, update: refresh };
}

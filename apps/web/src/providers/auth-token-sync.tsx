"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/store/app-store";

/** Mantém apiToken do Zustand alinhado com a sessão NextAuth após login. */
export function AuthTokenSync() {
  const { data: session } = useSession();
  const setApiToken = useAppStore((s) => s.setApiToken);
  const storeToken = useAppStore((s) => s.apiToken);

  useEffect(() => {
    const sessionToken = (session as { apiToken?: string } | null)?.apiToken;
    if (sessionToken && sessionToken !== storeToken) {
      setApiToken(sessionToken);
    }
  }, [session, storeToken, setApiToken]);

  return null;
}

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/auth/logout-client";
import { notifySessionChanged } from "@/lib/auth/session-events";

const LOGOUT_ERROR = "Não foi possível sair. Tente novamente.";

export function useLogout(redirectTo = "/login") {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logout = useCallback(async () => {
    setLoading(true);
    setError("");
    const ok = await performLogout();
    if (!ok) {
      setError(LOGOUT_ERROR);
      setLoading(false);
      return false;
    }
    notifySessionChanged();
    router.push(redirectTo);
    router.refresh();
    setLoading(false);
    return true;
  }, [router, redirectTo]);

  return { logout, loading, error, clearError: () => setError("") };
}

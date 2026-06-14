"use client";

import { useEffect, useState } from "react";
import type { AppRole } from "@/lib/permissions";

type FoundationSession = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

export function useFoundationSession() {
  const [user, setUser] = useState<FoundationSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await res.json();
        if (!cancelled && data?.user) {
          setUser(data.user as FoundationSession);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, role: user?.role ?? null, loading };
}

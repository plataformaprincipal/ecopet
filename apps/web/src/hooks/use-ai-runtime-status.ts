"use client";

import { useCallback, useEffect, useState } from "react";

export type AiRuntimeStatus = {
  aiEnabled: boolean;
  apiKeyPresent: boolean;
  model: string;
  isConfigured: boolean;
  session: {
    cookieUserResolved: boolean;
    userIdPresent: boolean;
    role: string | null;
  };
};

const DEFAULT: AiRuntimeStatus = {
  aiEnabled: true,
  apiKeyPresent: false,
  model: "",
  isConfigured: false,
  session: { cookieUserResolved: false, userIdPresent: false, role: null },
};

export function useAiRuntimeStatus() {
  const [status, setStatus] = useState<AiRuntimeStatus>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/runtime-status", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: AiRuntimeStatus;
      };
      if (!res.ok || json.success === false || !json.data) {
        setError("unavailable");
        setStatus((s) => ({ ...s, isConfigured: false }));
        return;
      }
      setStatus(json.data);
    } catch {
      setError("unavailable");
      setStatus((s) => ({ ...s, isConfigured: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}

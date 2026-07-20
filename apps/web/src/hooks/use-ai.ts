"use client";

import { useCallback, useEffect, useState } from "react";

export type AiClientStatus = {
  configured?: boolean;
  defaultModel?: string;
  globallyEnabled?: boolean;
  apiKeyMasked?: string | null;
  projectIdMasked?: string | null;
  environment?: string;
};

/**
 * Hook de fundação — status sanitizado via API admin.
 * Não envia prompts; não cria cliente OpenAI no browser.
 */
export function useAI() {
  const [status, setStatus] = useState<AiClientStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/foundation?view=status", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar status IA.");
        setStatus(null);
        return;
      }
      setStatus(json.data as AiClientStatus);
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}

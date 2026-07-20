"use client";

import { useCallback, useState } from "react";

export type AiHealthPayload = {
  status: string;
  checks: { id: string; ok: boolean; detail: string }[];
  latencyMs: number | null;
};

export function useAIHealth() {
  const [data, setData] = useState<AiHealthPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/foundation?view=health", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha no health IA.");
        return null;
      }
      setData(json.data as AiHealthPayload);
      return json.data as AiHealthPayload;
    } catch {
      setError("Erro de rede.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, run };
}

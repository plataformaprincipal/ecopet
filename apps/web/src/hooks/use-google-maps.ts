"use client";

import { useCallback, useEffect, useState } from "react";
import { isGoogleMapsClientReady } from "@/lib/google-maps/config";
import { getGoogleMapsLoaderState, loadGoogleMaps } from "@/lib/google-maps/loader";
import type { GoogleMapsLoaderState } from "@/lib/google-maps/types";

export function useGoogleMaps(opts?: { enabled?: boolean; language?: string }) {
  const enabled = opts?.enabled !== false;
  const [state, setState] = useState<GoogleMapsLoaderState>(() =>
    typeof window === "undefined" ? "idle" : getGoogleMapsLoaderState()
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return null;
    if (!isGoogleMapsClientReady()) {
      setState("error");
      setError("NOT_CONFIGURED");
      return null;
    }
    setState("loading");
    try {
      const g = await loadGoogleMaps({ language: opts?.language });
      setState("ready");
      setError(null);
      return g;
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "LOAD_FAILED");
      return null;
    }
  }, [enabled, opts?.language]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return {
    state,
    ready: state === "ready",
    loading: state === "loading",
    error,
    configured: isGoogleMapsClientReady(),
    reload: load,
  };
}

"use client";

import { useCallback, useRef, useState } from "react";
import type { TurnstileAction } from "@/lib/turnstile/actions";
import type { TurnstileWidgetState } from "@/lib/turnstile/types";

export type UseTurnstileOptions = {
  action: TurnstileAction;
  required?: boolean;
};

export function useTurnstile(options: UseTurnstileOptions) {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<TurnstileWidgetState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const tokenRef = useRef<string | null>(null);

  const clearToken = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
  }, []);

  const onVerify = useCallback((value: string) => {
    tokenRef.current = value;
    setToken(value);
    setState("verified");
    setError(null);
  }, []);

  const onExpire = useCallback(() => {
    clearToken();
    setState("expired");
    setError(null);
  }, [clearToken]);

  const onError = useCallback(() => {
    clearToken();
    setState("error");
    setError("turnstile.error");
  }, [clearToken]);

  const onLoad = useCallback(() => {
    setState((prev) => (prev === "idle" || prev === "loading" ? "ready" : prev));
  }, []);

  const reset = useCallback(() => {
    clearToken();
    setError(null);
    setState("ready");
    setResetKey((k) => k + 1);
  }, [clearToken]);

  const peekToken = useCallback(() => tokenRef.current, []);

  const consumeToken = useCallback(() => {
    const current = tokenRef.current;
    clearToken();
    // Evita UI "verified" mentindo após consumir sem reset do widget.
    setState((prev) => (prev === "verified" ? "ready" : prev));
    return current;
  }, [clearToken]);

  /**
   * Obtém token válido sem consumir cedo demais.
   * Se expirado/ausente e required, dispara reset do widget.
   */
  const ensureToken = useCallback((): string | null => {
    const current = tokenRef.current?.trim() || null;
    if (current) return current;
    if (options.required === false) return null;
    setState((prev) => (prev === "expired" || prev === "error" ? prev : "ready"));
    setResetKey((k) => k + 1);
    setError("turnstile.incomplete");
    return null;
  }, [options.required]);

  const isReady =
    options.required === false || state === "verified" || Boolean(tokenRef.current);

  return {
    action: options.action,
    token,
    state,
    error,
    resetKey,
    isVerified: state === "verified" && Boolean(tokenRef.current || token),
    isReady,
    onVerify,
    onExpire,
    onError,
    onLoad,
    reset,
    clearToken,
    peekToken,
    ensureToken,
    consumeToken,
    setLoading: () => setState("loading"),
    setUnavailable: () => setState("unavailable"),
  };
}

export type UseTurnstileReturn = ReturnType<typeof useTurnstile>;

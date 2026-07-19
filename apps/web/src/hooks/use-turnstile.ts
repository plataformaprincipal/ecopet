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

  const consumeToken = useCallback(() => {
    const current = tokenRef.current;
    clearToken();
    return current;
  }, [clearToken]);

  const isReady =
    options.required === false || state === "verified" || Boolean(tokenRef.current);

  return {
    action: options.action,
    token,
    state,
    error,
    resetKey,
    isVerified: state === "verified" && Boolean(token),
    isReady,
    onVerify,
    onExpire,
    onError,
    onLoad,
    reset,
    clearToken,
    consumeToken,
    setLoading: () => setState("loading"),
    setUnavailable: () => setState("unavailable"),
  };
}

export type UseTurnstileReturn = ReturnType<typeof useTurnstile>;

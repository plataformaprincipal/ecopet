"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchServerCart,
  type ServerCart,
} from "@/lib/marketplace/cart-client";

/** Source of truth for marketplace cart UI: server cart (/api/cart). */
export function useServerCart(opts?: { enabled?: boolean; refreshToken?: number }) {
  const enabled = opts?.enabled ?? true;
  const refreshToken = opts?.refreshToken ?? 0;
  const [cart, setCart] = useState<ServerCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    setLoading(true);
    setError("");
    try {
      const next = await fetchServerCart();
      setCart(next);
      return next;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao carregar carrinho.";
      setError(message);
      setCart(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshToken]);

  return {
    cart,
    setCart,
    loading,
    error,
    refresh,
    itemCount: cart?.itemCount ?? 0,
    subtotal: cart?.subtotal ?? 0,
  };
}

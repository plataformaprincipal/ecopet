"use client";

import { useCallback } from "react";
import {
  ensureDataLayer,
  pushEcommerce,
  pushEvent,
  pushPage,
  pushToDataLayer,
  pushUser,
} from "@/lib/gtm";
import type { GtmDataLayerObject } from "@/lib/gtm/types";

export function useDataLayer() {
  const push = useCallback((payload: GtmDataLayerObject) => pushToDataLayer(payload), []);
  const event = useCallback(
    (name: string, params?: Record<string, string | number | boolean | undefined | null>) =>
      pushEvent(name, params),
    []
  );
  const page = useCallback(
    (input: { path: string; title?: string; locale?: string }) => pushPage(input),
    []
  );
  const ecommerce = useCallback(
    (action: string, payload: Record<string, unknown>) => pushEcommerce(action, payload),
    []
  );
  const user = useCallback(
    (u: { user_id_hash?: string; role?: string; logged_in?: boolean }) => pushUser(u),
    []
  );

  return {
    ensure: ensureDataLayer,
    push,
    pushEvent: event,
    pushPage: page,
    pushEcommerce: ecommerce,
    pushUser: user,
  };
}

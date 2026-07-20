"use client";

import { useCallback } from "react";
import { pushIfGtmEnabled } from "@/lib/gtm";

/** Hook fino para Custom Events GTM (namespaced). */
export function usePushEvent() {
  return useCallback(
    (event: string, params?: Record<string, string | number | boolean | undefined | null>) =>
      pushIfGtmEnabled(event, params),
    []
  );
}

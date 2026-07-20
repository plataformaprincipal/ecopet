"use client";

import { useCallback } from "react";
import { analyticsService } from "@/lib/analytics/service";
import type { TrackableEvent } from "@/lib/analytics/factory";
import type { AnalyticsEventParams } from "@/lib/analytics/types";

/** Atalho tipado para disparar eventos do catálogo EcoPet. */
export function useTrackEvent() {
  return useCallback(
    (
      event: TrackableEvent,
      options?: { label?: string; value?: number; params?: AnalyticsEventParams }
    ) => {
      return analyticsService.track(event, options).sent;
    },
    []
  );
}

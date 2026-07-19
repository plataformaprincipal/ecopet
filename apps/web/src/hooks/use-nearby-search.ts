"use client";

import { useCallback, useState } from "react";
import type { LatLng, NearbyEntityType, NearbyResult } from "@/lib/google-maps/types";

export function useNearbySearch() {
  const [results, setResults] = useState<NearbyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (params: {
      origin: LatLng;
      radiusKm?: number;
      type?: NearbyEntityType | "all";
      category?: string;
      city?: string;
      state?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          lat: String(params.origin.lat),
          lng: String(params.origin.lng),
          radiusKm: String(params.radiusKm ?? 10),
          type: params.type ?? "all",
        });
        if (params.category) qs.set("category", params.category);
        if (params.city) qs.set("city", params.city);
        if (params.state) qs.set("state", params.state);

        const res = await fetch(`/api/maps/nearby?${qs.toString()}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          setError(json.error?.message ?? "NEARBY_FAILED");
          setResults([]);
          return [];
        }
        const list = (json.data?.results as NearbyResult[]) || [];
        setResults(list);
        return list;
      } catch {
        setError("NETWORK");
        setResults([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { results, loading, error, search };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import { parseLegacyPlaceResult } from "@/lib/google-maps/places";
import type { StructuredAddress } from "@/lib/google-maps/types";

export type AutocompleteSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

/**
 * Autocomplete Places com debounce + session token (reduz custo).
 * Não chama Places Details até o usuário selecionar.
 */
export function useAddressAutocomplete(opts?: {
  enabled?: boolean;
  debounceMs?: number;
  language?: string;
}) {
  const maps = useGoogleMaps({ enabled: opts?.enabled !== false, language: opts?.language });
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  const ensureSession = useCallback(() => {
    if (!sessionTokenRef.current && typeof google !== "undefined") {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  useEffect(() => {
    if (!maps.ready || typeof google === "undefined") return;
    serviceRef.current = new google.maps.places.AutocompleteService();
  }, [maps.ready]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (!maps.ready || q.length < 3) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(() => {
      const service = serviceRef.current;
      if (!service) return;
      setLoading(true);
      setError(null);
      service.getPlacePredictions(
        {
          input: q,
          componentRestrictions: { country: "br" },
          types: ["address"],
          sessionToken: ensureSession() || undefined,
          language: opts?.language?.startsWith("es")
            ? "es"
            : opts?.language?.startsWith("en")
              ? "en"
              : "pt-BR",
        },
        (predictions, status) => {
          setLoading(false);
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setSuggestions([]);
              return;
            }
            setSuggestions([]);
            setError(status);
            return;
          }
          setSuggestions(
            predictions.map((p) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || "",
            }))
          );
        }
      );
    }, opts?.debounceMs ?? 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, maps.ready, ensureSession, opts?.debounceMs, opts?.language]);

  const selectPlace = useCallback(
    async (placeId: string): Promise<StructuredAddress | null> => {
      if (!maps.ready || typeof google === "undefined") return null;
      return new Promise((resolve) => {
        const div = document.createElement("div");
        const places = new google.maps.places.PlacesService(div);
        places.getDetails(
          {
            placeId,
            fields: ["address_components", "formatted_address", "geometry", "place_id"],
            sessionToken: ensureSession() || undefined,
          },
          (place, status) => {
            resetSession();
            if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
              setError(status);
              resolve(null);
              return;
            }
            resolve(parseLegacyPlaceResult(place));
          }
        );
      });
    },
    [maps.ready, ensureSession, resetSession]
  );

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
    configured: maps.configured,
    mapsReady: maps.ready,
    selectPlace,
    clearSuggestions: () => setSuggestions([]),
  };
}

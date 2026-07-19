"use client";

import { useCallback, useState } from "react";
import type { LatLng } from "@/lib/google-maps/types";

export type GeolocationState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

/**
 * Geolocalização do navegador — somente após clique explícito.
 * Não rastreia continuamente.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>("idle");
  const [position, setPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unavailable");
      setError("UNSUPPORTED");
      return;
    }

    setState("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setState("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setState("denied");
        else if (err.code === err.TIMEOUT) setState("timeout");
        else if (err.code === err.POSITION_UNAVAILABLE) setState("unavailable");
        else setState("error");
        setError(err.message || "GEO_ERROR");
      },
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 60_000,
      }
    );
  }, []);

  const clear = useCallback(() => {
    setPosition(null);
    setAccuracy(null);
    setState("idle");
    setError(null);
  }, []);

  return { state, position, accuracy, error, request, clear };
}

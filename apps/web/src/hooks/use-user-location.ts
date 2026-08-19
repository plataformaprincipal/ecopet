"use client";

import { useCallback, useState } from "react";
import {
  clearUserLocation,
  getUserCoordinates,
  getUserLocationMeta,
  locationIsKnown,
  markLocationDenied,
  requestBrowserLocation,
  setManualCity,
  setManualLocationByCep,
  type UserLocationState,
} from "@/lib/location/user-location";

export function useUserLocation() {
  const [meta, setMeta] = useState(() => (typeof window === "undefined" ? { state: "unknown" as UserLocationState } : getUserLocationMeta()));
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() =>
    typeof window === "undefined" ? null : getUserCoordinates()
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setMeta(getUserLocationMeta());
    setCoords(getUserCoordinates());
  }, []);

  const request = useCallback(async () => {
    setError(null);
    const result = await requestBrowserLocation();
    setMeta(getUserLocationMeta());
    setCoords(result.coords);
    if (result.state === "denied") setError("DENIED");
    return result;
  }, []);

  const deny = useCallback(() => {
    markLocationDenied();
    setMeta(getUserLocationMeta());
    setError("DENIED");
  }, []);

  const setCep = useCallback(async (cep: string) => {
    setError(null);
    const result = await setManualLocationByCep(cep);
    setMeta(getUserLocationMeta());
    setCoords(result.coords);
    if (!result.ok) setError(result.error ?? "CEP");
    return result;
  }, []);

  const setCity = useCallback(async (city: string, stateUf?: string) => {
    const result = await setManualCity(city, stateUf);
    setMeta(getUserLocationMeta());
    setCoords(result.coords);
    if (!result.ok) setError("CITY");
    return result;
  }, []);

  const clear = useCallback(() => {
    clearUserLocation();
    setMeta({ state: "unknown" });
    setCoords(null);
    setError(null);
  }, []);

  return {
    state: meta.state,
    meta,
    coords,
    error,
    known: locationIsKnown(meta.state) && coords != null,
    label: meta.label,
    request,
    deny,
    setCep,
    setCity,
    clear,
    refresh,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ecopet:ai:active-pet";

export function useActivePetForAi(petIds: string[]) {
  const [activePetId, setActivePetIdState] = useState<string | null>(null);
  const petIdsKey = petIds.join(",");

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const ids = petIdsKey.length > 0 ? petIdsKey.split(",") : [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ids.includes(stored)) {
      setActivePetIdState(stored);
    } else if (ids[0]) {
      setActivePetIdState(ids[0]);
    } else {
      setActivePetIdState(null);
    }
  }, [petIdsKey]);

  const setActivePetId = useCallback((id: string | null) => {
    setActivePetIdState(id);
    if (typeof localStorage === "undefined") return;
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { activePetId, setActivePetId };
}

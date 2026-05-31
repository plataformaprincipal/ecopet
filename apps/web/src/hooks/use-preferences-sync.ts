"use client";

import { useEffect, useRef } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { useAppStore } from "@/store/app-store";
import { api } from "@/lib/api";
import { DEFAULT_PREFERENCES } from "@/lib/accessibility/types";

function pickPreferences(state: ReturnType<typeof useAccessibilityStore.getState>) {
  const {
    increaseFont: _a,
    decreaseFont: _b,
    resetFont: _c,
    increaseLetterSpacing: _d,
    decreaseLetterSpacing: _e,
    increaseLineHeight: _f,
    decreaseLineHeight: _g,
    toggle: _h,
    setLocale: _i,
    reset: _j,
    hasActiveSettings: _k,
    ...rest
  } = state;
  return rest;
}

/** Sincroniza preferências a11y + idioma: localStorage (visitante) e perfil (logado). */
export function usePreferencesSync() {
  const token = useAppStore((s) => s.apiToken);
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!token || loaded.current) return;
    api<{ preferences?: { a11y?: Partial<typeof DEFAULT_PREFERENCES> } }>("/api/users/me", { token })
      .then((user) => {
        if (user.preferences?.a11y) {
          useAccessibilityStore.setState({ ...DEFAULT_PREFERENCES, ...user.preferences.a11y });
        }
        loaded.current = true;
      })
      .catch(() => {
        loaded.current = true;
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const unsub = useAccessibilityStore.subscribe((state) => {
      if (!loaded.current) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api("/api/users/me/preferences", {
          method: "PATCH",
          token: token!,
          body: JSON.stringify({ a11y: pickPreferences(state) }),
        }).catch(() => {});
      }, 1500);
    });

    return () => {
      unsub();
      clearTimeout(saveTimer.current);
    };
  }, [token]);
}

export function PreferencesSync() {
  usePreferencesSync();
  return null;
}

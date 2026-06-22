"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { useAppStore } from "@/store/app-store";
import { DEFAULT_PREFERENCES } from "@/lib/accessibility/types";
import {
  loadRemotePreferences,
  pickA11yPreferences,
  saveRemotePreferences,
} from "@/lib/accessibility/preferences-sync.client";

/** Sincroniza preferências a11y: localStorage (visitante) e perfil (logado). VLibras nunca depende da API. */
export function usePreferencesSync() {
  const { status: sessionStatus } = useSession();
  const token = useAppStore((s) => s.apiToken);
  const setApiToken = useAppStore((s) => s.setApiToken);
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isAuthenticated = sessionStatus === "authenticated";
  const canSyncToServer = isAuthenticated && Boolean(token);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!canSyncToServer) {
      loaded.current = true;
      return;
    }

    if (loaded.current) return;

    let cancelled = false;

    loadRemotePreferences(token!)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          if (result.unauthorized) setApiToken(null);
          loaded.current = true;
          return;
        }
        if (result.a11y) {
          useAccessibilityStore.setState({ ...DEFAULT_PREFERENCES, ...result.a11y });
        }
        loaded.current = true;
      })
      .catch(() => {
        if (!cancelled) loaded.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, canSyncToServer, token, setApiToken]);

  useEffect(() => {
    if (!canSyncToServer) return;

    const unsub = useAccessibilityStore.subscribe((state) => {
      if (!loaded.current) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const result = await saveRemotePreferences(token!, pickA11yPreferences(state));
        if (result.unauthorized) setApiToken(null);
      }, 1500);
    });

    return () => {
      unsub();
      clearTimeout(saveTimer.current);
    };
  }, [canSyncToServer, token, setApiToken]);

  useEffect(() => {
    if (sessionStatus !== "unauthenticated") return;
    loaded.current = true;
  }, [sessionStatus]);
}

export function PreferencesSync() {
  usePreferencesSync();
  return null;
}

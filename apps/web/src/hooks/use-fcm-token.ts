"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearLocalFcmAssociation,
  getBrowserPermissionState,
  getOrCreateDeviceId,
  requestFcmToken,
} from "@/lib/firebase/messaging-client";
import type { PushPermissionState } from "@/lib/firebase/types";

export function useFcmToken() {
  const [state, setState] = useState<PushPermissionState>("DEFAULT");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    setState(getBrowserPermissionState());
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const register = useCallback(async () => {
    setBusy(true);
    setError(null);
    setState("REQUESTING");
    try {
      const result = await requestFcmToken();
      setDeviceId(result.deviceId);

      if (!result.token) {
        setState(result.state);
        setError(result.error || null);
        return { ok: false as const, state: result.state };
      }

      const res = await fetch("/api/notifications/push/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: result.token,
          deviceId: result.deviceId,
          permissionStatus: "GRANTED",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        setState("TOKEN_FAILED");
        setError(json?.error?.message || "REGISTER_FAILED");
        return { ok: false as const, state: "TOKEN_FAILED" as const };
      }

      setState("TOKEN_REGISTERED");
      setLastSyncedAt(new Date().toISOString());
      try {
        localStorage.setItem("ecopet.fcm.tokenRegistered", "1");
      } catch {
        /* ignore */
      }
      return { ok: true as const, state: "TOKEN_REGISTERED" as const };
    } catch {
      setState("ERROR");
      setError("UNEXPECTED");
      return { ok: false as const, state: "ERROR" as const };
    } finally {
      setBusy(false);
    }
  }, []);

  const unregister = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const id = deviceId || getOrCreateDeviceId();
      await fetch("/api/notifications/push/unregister", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: id }),
      });
      clearLocalFcmAssociation();
      setState(getBrowserPermissionState());
      setLastSyncedAt(null);
      return true;
    } catch {
      setError("UNREGISTER_FAILED");
      return false;
    } finally {
      setBusy(false);
    }
  }, [deviceId]);

  return {
    state,
    deviceId,
    busy,
    error,
    lastSyncedAt,
    register,
    unregister,
  };
}

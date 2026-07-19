"use client";

import { useCallback, useEffect, useState } from "react";
import { isFirebaseClientReady } from "@/lib/firebase/config";
import { isMessagingSupportedBrowser } from "@/lib/firebase/client";
import { getBrowserPermissionState } from "@/lib/firebase/messaging-client";
import { useFcmToken } from "@/hooks/use-fcm-token";
import type { PushPermissionState } from "@/lib/firebase/types";

export function usePushNotifications() {
  const fcm = useFcmToken();
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [serverActive, setServerActive] = useState(false);

  useEffect(() => {
    setSupported(isMessagingSupportedBrowser());
    setConfigured(isFirebaseClientReady());
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!fcm.deviceId) return;
    try {
      const res = await fetch(
        `/api/notifications/push/status?deviceId=${encodeURIComponent(fcm.deviceId)}`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (res.ok && json?.data) {
        setConfigured(Boolean(json.data.configured));
        setServerActive(Boolean(json.data.activeOnThisDevice));
      }
    } catch {
      /* ignore */
    }
  }, [fcm.deviceId]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const permission: PushPermissionState =
    !supported ? "UNSUPPORTED" : fcm.state === "DEFAULT" ? getBrowserPermissionState() : fcm.state;

  return {
    ...fcm,
    supported,
    configured,
    serverActive,
    permission,
    refreshStatus,
    enable: fcm.register,
    disable: fcm.unregister,
  };
}

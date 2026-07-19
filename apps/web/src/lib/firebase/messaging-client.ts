"use client";

import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { getFirebaseApp, isBrowser, isMessagingSupportedBrowser } from "./client";
import { getFirebaseVapidKey } from "./config";
import type { PushPermissionState } from "./types";

const SW_PATH = "/firebase-messaging-sw.js";
const DEVICE_ID_KEY = "ecopet.fcm.deviceId";

let messagingSingleton: Messaging | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

export function getOrCreateDeviceId(): string {
  if (!isBrowser()) return "ssr";
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `ephemeral-${Date.now()}`;
  }
}

export function clearLocalFcmAssociation(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem("ecopet.fcm.tokenRegistered");
  } catch {
    /* ignore */
  }
}

export async function getFirebaseMessagingClient(): Promise<Messaging | null> {
  if (!isBrowser() || !isMessagingSupportedBrowser()) return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if (messagingSingleton) return messagingSingleton;
  const app = getFirebaseApp();
  if (!app) return null;
  messagingSingleton = getMessaging(app);
  return messagingSingleton;
}

export async function registerFirebaseMessagingSw(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowser() || !("serviceWorker" in navigator)) return null;
  try {
    swRegistration =
      (await navigator.serviceWorker.getRegistration(SW_PATH)) ||
      (await navigator.serviceWorker.register(SW_PATH, { scope: "/" }));
    await navigator.serviceWorker.ready;
    return swRegistration;
  } catch {
    return null;
  }
}

export function getBrowserPermissionState(): PushPermissionState {
  if (!isMessagingSupportedBrowser()) return "UNSUPPORTED";
  if (!("Notification" in window)) return "UNSUPPORTED";
  if (Notification.permission === "granted") return "GRANTED";
  if (Notification.permission === "denied") return "DENIED";
  return "DEFAULT";
}

/**
 * Solicita permissão (só após gesto do usuário) e obtém token FCM.
 * Não registra no backend — isso fica a cargo do caller autenticado.
 */
export async function requestFcmToken(): Promise<{
  state: PushPermissionState;
  token: string | null;
  deviceId: string;
  error?: string;
}> {
  const deviceId = getOrCreateDeviceId();

  if (!isMessagingSupportedBrowser()) {
    return { state: "UNSUPPORTED", token: null, deviceId };
  }

  if (Notification.permission === "denied") {
    return { state: "DENIED", token: null, deviceId };
  }

  try {
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    if (permission !== "granted") {
      return { state: "DENIED", token: null, deviceId };
    }

    const vapidKey = getFirebaseVapidKey();
    if (!vapidKey) {
      return { state: "ERROR", token: null, deviceId, error: "VAPID_MISSING" };
    }

    const registration = await registerFirebaseMessagingSw();
    if (!registration) {
      return { state: "ERROR", token: null, deviceId, error: "SW_REGISTER_FAILED" };
    }

    const messaging = await getFirebaseMessagingClient();
    if (!messaging) {
      return { state: "ERROR", token: null, deviceId, error: "MESSAGING_UNAVAILABLE" };
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { state: "TOKEN_FAILED", token: null, deviceId, error: "EMPTY_TOKEN" };
    }

    return { state: "GRANTED", token, deviceId };
  } catch (err) {
    return {
      state: "TOKEN_FAILED",
      token: null,
      deviceId,
      error: err instanceof Error ? err.name : "TOKEN_ERROR",
    };
  }
}

export function subscribeForegroundMessages(
  handler: (payload: MessagePayload) => void
): () => void {
  let unsub: (() => void) | undefined;
  let cancelled = false;

  void (async () => {
    const messaging = await getFirebaseMessagingClient();
    if (!messaging || cancelled) return;
    unsub = onMessage(messaging, handler);
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export type { MessagePayload };

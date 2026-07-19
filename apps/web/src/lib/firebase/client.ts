/**
 * Firebase Web SDK — apenas browser.
 * Nunca importar firebase-admin daqui.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirebasePublicConfig, isFirebaseClientReady } from "./config";

let appSingleton: FirebaseApp | null = null;

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isSecurePushContext(): boolean {
  if (!isBrowser()) return false;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function isMessagingSupportedBrowser(): boolean {
  if (!isBrowser()) return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!isSecurePushContext()) return false;
  return true;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isBrowser()) return null;
  if (!isFirebaseClientReady()) return null;

  if (appSingleton) return appSingleton;
  const existing = getApps()[0];
  if (existing) {
    appSingleton = existing;
    return existing;
  }

  const config = getFirebasePublicConfig();
  if (!config) return null;

  appSingleton = initializeApp(config);
  return appSingleton;
}

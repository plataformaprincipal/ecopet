/**
 * Configuração pública do Firebase Web SDK.
 * Usa apenas variáveis NEXT_PUBLIC_* — seguro para Client Components.
 */

import type { FirebasePublicConfig } from "./types";

function env(key: string, source: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = source[key]?.trim();
  return v || undefined;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes("xxxxxxxxx") ||
    v.includes("your_") ||
    v.includes("changeme") ||
    v.includes("replace_me") ||
    v === "xxx"
  );
}

export function getFirebasePublicConfig(
  source: NodeJS.ProcessEnv = process.env
): FirebasePublicConfig | null {
  const apiKey = env("NEXT_PUBLIC_FIREBASE_API_KEY", source);
  const authDomain = env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", source);
  const projectId = env("NEXT_PUBLIC_FIREBASE_PROJECT_ID", source);
  const storageBucket = env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", source);
  const messagingSenderId = env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", source);
  const appId = env("NEXT_PUBLIC_FIREBASE_APP_ID", source);
  const measurementId = env("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", source);

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId ||
    isPlaceholder(apiKey) ||
    isPlaceholder(projectId) ||
    isPlaceholder(appId)
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId: measurementId && !isPlaceholder(measurementId) ? measurementId : undefined,
  };
}

export function isFirebasePublicConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return getFirebasePublicConfig(source) !== null;
}

export function getFirebaseVapidKey(source: NodeJS.ProcessEnv = process.env): string | null {
  const key = env("NEXT_PUBLIC_FIREBASE_VAPID_KEY", source);
  if (!key || isPlaceholder(key)) return null;
  return key;
}

export function isFirebaseVapidConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getFirebaseVapidKey(source));
}

export function isFirebaseClientReady(source: NodeJS.ProcessEnv = process.env): boolean {
  return isFirebasePublicConfigured(source) && isFirebaseVapidConfigured(source);
}

export function maskProjectId(projectId: string | undefined | null): string | null {
  if (!projectId) return null;
  if (projectId.length <= 6) return "***";
  return `${projectId.slice(0, 3)}***${projectId.slice(-2)}`;
}

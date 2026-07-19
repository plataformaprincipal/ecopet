import "server-only";

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { FirebaseConfigError } from "./errors";
import { maskProjectId } from "./config";
import { normalizeFirebasePrivateKey } from "./private-key";
import type { FirebaseAdminSanitizedStatus } from "./types";

export { normalizeFirebasePrivateKey } from "./private-key";

type GlobalFirebaseAdmin = {
  app?: App;
  messaging?: Messaging;
};

const globalForFirebase = globalThis as unknown as {
  __ecopetFirebaseAdmin?: GlobalFirebaseAdmin;
};

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

export function isFirebaseAdminConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  const projectId = env("FIREBASE_PROJECT_ID", source);
  const clientEmail = env("FIREBASE_CLIENT_EMAIL", source);
  const privateKey = normalizeFirebasePrivateKey(env("FIREBASE_PRIVATE_KEY", source));
  return Boolean(
    projectId &&
      !isPlaceholder(projectId) &&
      clientEmail &&
      !isPlaceholder(clientEmail) &&
      clientEmail.includes("@") &&
      privateKey
  );
}

export function getFirebaseAdminSanitizedStatus(
  source: NodeJS.ProcessEnv = process.env
): FirebaseAdminSanitizedStatus {
  const projectId = env("FIREBASE_PROJECT_ID", source);
  const clientEmail = env("FIREBASE_CLIENT_EMAIL", source);
  const privateKeyOk = Boolean(normalizeFirebasePrivateKey(env("FIREBASE_PRIVATE_KEY", source)));
  const projectIdConfigured = Boolean(projectId && !isPlaceholder(projectId));
  const clientEmailConfigured = Boolean(
    clientEmail && !isPlaceholder(clientEmail) && clientEmail.includes("@")
  );
  const vapidConfigured = Boolean(
    env("NEXT_PUBLIC_FIREBASE_VAPID_KEY", source) &&
      !isPlaceholder(env("NEXT_PUBLIC_FIREBASE_VAPID_KEY", source))
  );
  const publicConfigConfigured = Boolean(
    env("NEXT_PUBLIC_FIREBASE_API_KEY", source) &&
      env("NEXT_PUBLIC_FIREBASE_PROJECT_ID", source) &&
      env("NEXT_PUBLIC_FIREBASE_APP_ID", source)
  );

  const configured =
    projectIdConfigured && clientEmailConfigured && privateKeyOk && publicConfigConfigured && vapidConfigured;

  let status: FirebaseAdminSanitizedStatus["status"] = "MISSING";
  if (configured) status = "READY";
  else if (projectIdConfigured || clientEmailConfigured || privateKeyOk || publicConfigConfigured) {
    status = "PARTIAL";
  }

  const flag = env("FIREBASE_MESSAGING_ENABLED", source)?.toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off" || flag === "disabled") {
    status = "DISABLED";
  }

  const nodeEnv = env("NODE_ENV", source);
  const vercelEnv = env("VERCEL_ENV", source);
  let environment: FirebaseAdminSanitizedStatus["environment"] = "unknown";
  if (vercelEnv === "production" || nodeEnv === "production") environment = "production";
  else if (vercelEnv === "preview") environment = "preview";
  else if (nodeEnv === "test") environment = "test";
  else if (nodeEnv === "development") environment = "development";

  return {
    configured,
    projectIdConfigured,
    clientEmailConfigured,
    privateKeyConfigured: privateKeyOk,
    vapidConfigured,
    publicConfigConfigured,
    projectIdMasked: maskProjectId(projectId),
    environment,
    status,
    sanitizedMessage:
      status === "READY"
        ? "Firebase Admin (FCM HTTP v1) configurado."
        : status === "DISABLED"
          ? "Firebase Messaging desabilitado por flag."
          : "Configuração Firebase incompleta — verifique variáveis server/public.",
  };
}

/**
 * Inicializa Firebase Admin uma única vez (hot reload / serverless safe).
 * Não faz chamada externa — apenas carrega credenciais em memória.
 */
export function getFirebaseAdminApp(): App | null {
  if (!isFirebaseAdminConfigured()) return null;

  const cached = globalForFirebase.__ecopetFirebaseAdmin;
  if (cached?.app) return cached.app;

  const existing = getApps()[0];
  if (existing) {
    globalForFirebase.__ecopetFirebaseAdmin = { app: existing };
    return existing;
  }

  const projectId = env("FIREBASE_PROJECT_ID")!;
  const clientEmail = env("FIREBASE_CLIENT_EMAIL")!;
  const privateKey = normalizeFirebasePrivateKey(env("FIREBASE_PRIVATE_KEY"))!;

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });

  globalForFirebase.__ecopetFirebaseAdmin = { app };
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  const cached = globalForFirebase.__ecopetFirebaseAdmin;
  if (cached?.messaging) return cached.messaging;

  const app = getFirebaseAdminApp();
  if (!app) return null;

  const messaging = getMessaging(app);
  globalForFirebase.__ecopetFirebaseAdmin = {
    ...(globalForFirebase.__ecopetFirebaseAdmin || {}),
    app,
    messaging,
  };
  return messaging;
}

export function assertFirebaseAdminReady(): Messaging {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    throw new FirebaseConfigError(
      "FIREBASE_ADMIN_NOT_CONFIGURED",
      "Firebase Admin não configurado"
    );
  }
  return messaging;
}

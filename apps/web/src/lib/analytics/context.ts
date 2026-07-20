"use client";

import { detectAnalyticsEnvironment } from "./config";

const ANON_KEY = "ecopet.analytics.anonymous_id";
const SESSION_KEY = "ecopet.analytics.session_id";
const USER_KEY = "ecopet.analytics.user_ctx";

export type AnalyticsUserContext = {
  /** ID interno opcional (cuid) — nunca e-mail/telefone. */
  userId?: string | null;
  userRole?: string | null;
};

export type AnalyticsClientContext = {
  anonymous_id: string;
  session_id: string;
  user_id?: string;
  user_role?: string;
  environment: string;
  language?: string;
  device?: string;
  screen?: string;
  page?: string;
  country?: string;
  state?: string;
  city?: string;
  timestamp: string;
};

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function readStorage(storage: Storage | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage | undefined, key: string, value: string) {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "anon_ssr";
  const existing = readStorage(window.localStorage, ANON_KEY);
  if (existing) return existing;
  const id = randomId("anon");
  writeStorage(window.localStorage, ANON_KEY, id);
  return id;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "sess_ssr";
  const existing = readStorage(window.sessionStorage, SESSION_KEY);
  if (existing) return existing;
  const id = randomId("sess");
  writeStorage(window.sessionStorage, SESSION_KEY, id);
  return id;
}

/** Define contexto de usuário autenticado (sem PII). */
export function setAnalyticsUser(ctx: AnalyticsUserContext | null) {
  if (typeof window === "undefined") return;
  if (!ctx || (!ctx.userId && !ctx.userRole)) {
    try {
      window.sessionStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  writeStorage(
    window.sessionStorage,
    USER_KEY,
    JSON.stringify({
      userId: ctx.userId ?? null,
      userRole: ctx.userRole ?? null,
    })
  );
}

export function getAnalyticsUser(): AnalyticsUserContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(USER_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AnalyticsUserContext;
  } catch {
    return {};
  }
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

/** Contexto client sanitizado para enriquecer eventos. */
export function getClientAnalyticsContext(
  extras?: Partial<Pick<AnalyticsClientContext, "country" | "state" | "city" | "screen">>
): AnalyticsClientContext {
  const user = getAnalyticsUser();
  return {
    anonymous_id: getOrCreateAnonymousId(),
    session_id: getOrCreateSessionId(),
    ...(user.userId ? { user_id: user.userId } : {}),
    ...(user.userRole ? { user_role: user.userRole } : {}),
    environment: detectAnalyticsEnvironment(),
    language:
      typeof document !== "undefined"
        ? document.documentElement.lang || navigator.language
        : undefined,
    device: detectDevice(),
    page: typeof window !== "undefined" ? window.location.pathname : undefined,
    screen: extras?.screen,
    country: extras?.country,
    state: extras?.state,
    city: extras?.city,
    timestamp: new Date().toISOString(),
  };
}

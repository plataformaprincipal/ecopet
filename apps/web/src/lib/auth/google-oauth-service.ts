import "server-only";

import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveAuthSecret } from "@/lib/auth-secret";
import { resolvePublicAppUrl } from "@/lib/app-url";
import { normalizeRegistrationEmail } from "@/lib/validation/email";
import { writeAuditLog } from "@/lib/audit-log";
import { auditLogin, auditLoginFailed } from "@/lib/auth/auth-audit";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import {
  GOOGLE_AUTHORIZATION_ENDPOINT,
  GOOGLE_AUTH_SCOPES,
  GOOGLE_ISSUERS,
  GOOGLE_PRODUCTION_ORIGIN,
  GOOGLE_PROVIDER,
  GOOGLE_TOKEN_ENDPOINT,
  googleCallbackPath,
  isAllowedGoogleRole,
  isGoogleAuthConfigured,
  safeInternalPath,
  type GoogleOAuthIntent,
} from "@/lib/auth/google-oauth";

export const GOOGLE_OAUTH_COOKIE = "ecopet-google-oauth";
export const GOOGLE_PENDING_COOKIE = "ecopet-google-pending";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const oauthSecret = () => new TextEncoder().encode(`${resolveAuthSecret()}:google-oauth`);

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
};

type OAuthCookiePayload = {
  state: string;
  nonce: string;
  verifier: string;
  intent: GoogleOAuthIntent;
  returnTo: string;
};

export function googleRedirectUri(source: NodeJS.ProcessEnv = process.env): string {
  if (source.VERCEL_ENV === "production") {
    return `${GOOGLE_PRODUCTION_ORIGIN}${googleCallbackPath()}`;
  }
  const base = resolvePublicAppUrl();
  return `${base}${googleCallbackPath()}`;
}

export function googleJavascriptOrigins(): string[] {
  if (process.env.VERCEL_ENV === "production") {
    return [GOOGLE_PRODUCTION_ORIGIN];
  }
  return [resolvePublicAppUrl()];
}

function pkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function buildGoogleAuthorizationUrl(params: {
  intent: GoogleOAuthIntent;
  returnTo?: string | null;
}): Promise<{ url: string; cookieValue: string }> {
  if (!isGoogleAuthConfigured()) {
    throw new Error("OAUTH_NOT_CONFIGURED");
  }
  const state = randomBytes(24).toString("hex");
  const nonce = randomBytes(24).toString("hex");
  const verifier = pkceVerifier();
  const returnTo = safeInternalPath(params.returnTo, "/");
  const payload: OAuthCookiePayload = {
    state,
    nonce,
    verifier,
    intent: params.intent,
    returnTo,
  };
  const cookieValue = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(oauthSecret());

  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!.trim());
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_AUTH_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", pkceChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", params.intent === "link" ? "consent" : "select_account");
  return { url: url.toString(), cookieValue };
}

export async function readOAuthCookie(value: string | undefined): Promise<OAuthCookiePayload | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, oauthSecret());
    if (typeof payload.state !== "string" || typeof payload.nonce !== "string") return null;
    return payload as unknown as OAuthCookiePayload;
  } catch {
    return null;
  }
}

export async function exchangeGoogleCode(params: {
  code: string;
  verifier: string;
}): Promise<{ idToken: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    redirect_uri: googleRedirectUri(),
    code_verifier: params.verifier,
  });
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { id_token?: string };
  if (!res.ok || !json.id_token) throw new Error("TOKEN_INVALID");
  return { idToken: json.id_token };
}

export async function verifyGoogleIdToken(params: {
  idToken: string;
  nonce: string;
}): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(params.idToken, googleJwks, {
    issuer: [...GOOGLE_ISSUERS],
    audience: process.env.GOOGLE_CLIENT_ID!.trim(),
  });
  if (payload.nonce !== params.nonce) throw new Error("INVALID_NONCE");
  const email = typeof payload.email === "string" ? normalizeRegistrationEmail(payload.email) : "";
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub || !email) throw new Error("TOKEN_INVALID");
  if (!emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
  return {
    sub,
    email,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0],
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
    emailVerified: true,
  };
}

export async function signPendingGoogleIdentity(identity: GoogleIdentity): Promise<string> {
  return new SignJWT(identity)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(oauthSecret());
}

export async function readPendingGoogleIdentity(value: string | undefined): Promise<GoogleIdentity | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, oauthSecret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: normalizeRegistrationEmail(payload.email),
      name: typeof payload.name === "string" ? payload.name : payload.email,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
      emailVerified: true,
    };
  } catch {
    return null;
  }
}

export type GoogleCallbackResult =
  | { kind: "session"; userId: string; email: string; role: UserRole; accountStatus: AccountStatus; returnTo: string }
  | { kind: "pending"; cookieValue: string; returnTo: string }
  | { kind: "error"; code: string; returnTo: string };

export async function resolveGoogleCallback(params: {
  identity: GoogleIdentity;
  intent: GoogleOAuthIntent;
  returnTo: string;
  currentUserId?: string | null;
}): Promise<GoogleCallbackResult> {
  const returnTo = safeInternalPath(params.returnTo, "/");
  const existingIdentity = await prisma.externalAuthAccount.findUnique({
    where: {
      provider_providerAccountId: { provider: GOOGLE_PROVIDER, providerAccountId: params.identity.sub },
    },
    include: { user: true },
  });

  if (existingIdentity) {
    const user = existingIdentity.user;
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      return { kind: "error", code: "ACCOUNT_SUSPENDED", returnTo };
    }
    if (user.accountStatus !== AccountStatus.ACTIVE && user.accountStatus !== AccountStatus.PENDING) {
      return { kind: "error", code: "ACCOUNT_INACTIVE", returnTo };
    }
    if (params.intent === "link" && params.currentUserId && params.currentUserId !== user.id) {
      return { kind: "error", code: "GENERIC", returnTo };
    }
    return {
      kind: "session",
      userId: user.id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      returnTo: returnTo === "/" ? dashboardPathForRole(user.role) : returnTo,
    };
  }

  if (params.intent === "link") {
    if (!params.currentUserId) return { kind: "error", code: "GENERIC", returnTo };
    const linked = await linkGoogleToUser({ userId: params.currentUserId, identity: params.identity });
    if (!linked.ok) return { kind: "error", code: linked.code, returnTo };
    const user = await prisma.user.findUnique({ where: { id: params.currentUserId } });
    if (!user) return { kind: "error", code: "GENERIC", returnTo };
    return {
      kind: "session",
      userId: user.id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      returnTo: "/configuracoes?tab=seguranca",
    };
  }

  const emailOwner = await prisma.user.findUnique({ where: { email: params.identity.email } });
  if (emailOwner) {
    return { kind: "error", code: "ACCOUNT_EXISTS_PASSWORD", returnTo: "/login" };
  }

  const cookieValue = await signPendingGoogleIdentity(params.identity);
  return { kind: "pending", cookieValue, returnTo };
}

export async function completeGoogleOnboarding(params: {
  identity: GoogleIdentity;
  role: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}): Promise<
  { ok: true; userId: string; email: string; role: UserRole; accountStatus: AccountStatus } | { ok: false; code: string }
> {
  if (!params.termsAccepted || !params.privacyAccepted) return { ok: false, code: "TERMS_REQUIRED" };
  if (!isAllowedGoogleRole(params.role)) return { ok: false, code: "ADMIN_FORBIDDEN" };

  const existingIdentity = await prisma.externalAuthAccount.findUnique({
    where: {
      provider_providerAccountId: { provider: GOOGLE_PROVIDER, providerAccountId: params.identity.sub },
    },
  });
  if (existingIdentity) return { ok: false, code: "GENERIC" };

  const emailOwner = await prisma.user.findUnique({ where: { email: params.identity.email } });
  if (emailOwner) return { ok: false, code: "ACCOUNT_EXISTS_PASSWORD" };

  const role = params.role as UserRole;
  const accountStatus = role === "CLIENT" ? AccountStatus.ACTIVE : AccountStatus.PENDING;
  const username = await uniqueUsernameFromEmail(params.identity.email);

  const user = await prisma.user.create({
    data: {
      email: params.identity.email,
      name: params.identity.name.slice(0, 120),
      username,
      passwordHash: null,
      role,
      accountStatus,
      avatarUrl: params.identity.picture,
      termsAcceptedAt: new Date(),
      lgpdAcceptedAt: new Date(),
      externalAuthAccounts: {
        create: {
          provider: GOOGLE_PROVIDER,
          providerAccountId: params.identity.sub,
          email: params.identity.email,
        },
      },
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "CREATE",
    module: "auth",
    resource: "ExternalAuthAccount",
    resourceId: user.id,
    observation: "google.signup",
    entityAfter: { provider: GOOGLE_PROVIDER, role: user.role },
  }).catch(() => undefined);

  return { ok: true, userId: user.id, email: user.email, role: user.role, accountStatus: user.accountStatus };
}

export async function linkGoogleToUser(params: {
  userId: string;
  identity: GoogleIdentity;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const taken = await prisma.externalAuthAccount.findUnique({
    where: {
      provider_providerAccountId: { provider: GOOGLE_PROVIDER, providerAccountId: params.identity.sub },
    },
  });
  if (taken && taken.userId !== params.userId) return { ok: false, code: "GENERIC" };
  if (taken) return { ok: true };

  await prisma.externalAuthAccount.create({
    data: {
      userId: params.userId,
      provider: GOOGLE_PROVIDER,
      providerAccountId: params.identity.sub,
      email: params.identity.email,
    },
  });
  await writeAuditLog({
    actorId: params.userId,
    action: "UPDATE",
    module: "auth",
    resource: "ExternalAuthAccount",
    resourceId: params.userId,
    observation: "google.linked",
  }).catch(() => undefined);
  return { ok: true };
}

export async function unlinkGoogleFromUser(userId: string): Promise<{ ok: true } | { ok: false; code: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { externalAuthAccounts: true },
  });
  if (!user) return { ok: false, code: "GENERIC" };
  const google = user.externalAuthAccounts.find((a) => a.provider === GOOGLE_PROVIDER);
  if (!google) return { ok: false, code: "GENERIC" };
  if (!user.passwordHash) return { ok: false, code: "LAST_AUTH_METHOD" };

  await prisma.externalAuthAccount.delete({ where: { id: google.id } });
  await writeAuditLog({
    actorId: userId,
    action: "DELETE",
    module: "auth",
    resource: "ExternalAuthAccount",
    resourceId: userId,
    observation: "google.unlinked",
  }).catch(() => undefined);
  return { ok: true };
}

export async function getAccessMethods(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordHash: true,
      email: true,
      externalAuthAccounts: { select: { provider: true, createdAt: true } },
    },
  });
  if (!user) return null;
  return {
    email: user.email,
    passwordConfigured: Boolean(user.passwordHash),
    googleConnected: user.externalAuthAccounts.some((a) => a.provider === GOOGLE_PROVIDER),
    canUnlinkGoogle: Boolean(user.passwordHash) && user.externalAuthAccounts.some((a) => a.provider === GOOGLE_PROVIDER),
  };
}

async function uniqueUsernameFromEmail(email: string): Promise<string> {
  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase() || "user";
  for (let i = 0; i < 8; i++) {
    const candidate = `${base}${randomBytes(2).toString("hex")}`.slice(0, 20);
    const exists = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  return `u${randomBytes(8).toString("hex")}`.slice(0, 20);
}

export { auditLogin, auditLoginFailed };

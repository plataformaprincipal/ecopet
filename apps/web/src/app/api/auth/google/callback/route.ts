import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AccountStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-session";
import { mapGoogleOAuthError, safeInternalPath } from "@/lib/auth/google-oauth";
import {
  GOOGLE_OAUTH_COOKIE,
  GOOGLE_PENDING_COOKIE,
  exchangeGoogleCode,
  readOAuthCookie,
  resolveGoogleCallback,
  verifyGoogleIdToken,
} from "@/lib/auth/google-oauth-service";
import { auditLogin, auditLoginFailed } from "@/lib/auth/auth-audit";

export const dynamic = "force-dynamic";

function loginRedirect(origin: string, code: string, returnTo?: string) {
  const dest = new URL("/login", origin);
  dest.searchParams.set("google", code.toLowerCase());
  if (returnTo) dest.searchParams.set("callbackUrl", returnTo);
  return dest;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const jar = await cookies();
  const oauthCookie = jar.get(GOOGLE_OAUTH_COOKIE)?.value;
  const payload = await readOAuthCookie(oauthCookie);

  const clear = (res: NextResponse) => {
    res.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    return res;
  };

  if (error) {
    return clear(NextResponse.redirect(loginRedirect(origin, mapGoogleOAuthError(error))));
  }
  if (!code || !state || !payload || payload.state !== state) {
    return clear(NextResponse.redirect(loginRedirect(origin, "invalid_state")));
  }

  try {
    const { idToken } = await exchangeGoogleCode({ code, verifier: payload.verifier });
    const identity = await verifyGoogleIdToken({ idToken, nonce: payload.nonce });
    const current = payload.intent === "link" ? await getCurrentUser() : null;
    const result = await resolveGoogleCallback({
      identity,
      intent: payload.intent,
      returnTo: payload.returnTo,
      currentUserId: current?.id ?? null,
    });

    if (result.kind === "error") {
      void auditLoginFailed({ identifier: identity.email, reason: `GOOGLE_${result.code}` });
      return clear(NextResponse.redirect(loginRedirect(origin, result.code, result.returnTo)));
    }

    if (result.kind === "pending") {
      const res = NextResponse.redirect(new URL("/cadastro/google", origin));
      res.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
      res.cookies.set(GOOGLE_PENDING_COOKIE, result.cookieValue, { ...sessionCookieOptions(), maxAge: 20 * 60 });
      return res;
    }

    if (result.accountStatus === AccountStatus.SUSPENDED) {
      return clear(NextResponse.redirect(loginRedirect(origin, "account_suspended")));
    }

    const token = await createSessionToken(result.userId, result.email, result.role, result.accountStatus);
    void auditLogin({ userId: result.userId, email: result.email });
    const dest = safeInternalPath(result.returnTo, "/");
    const res = NextResponse.redirect(new URL(dest, origin));
    res.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (e) {
    const codeName = e instanceof Error && e.message ? e.message : "GENERIC";
    const mapped = ["INVALID_NONCE", "EMAIL_NOT_VERIFIED", "TOKEN_INVALID"].includes(codeName)
      ? codeName
      : "GENERIC";
    return clear(NextResponse.redirect(loginRedirect(origin, mapped)));
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sessionCookieOptions } from "@/lib/auth-session";
import { isGoogleAuthConfigured, safeInternalPath, type GoogleOAuthIntent } from "@/lib/auth/google-oauth";
import {
  GOOGLE_OAUTH_COOKIE,
  buildGoogleAuthorizationUrl,
} from "@/lib/auth/google-oauth-service";
import { checkDistributedRateLimit, clientIpForRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function oauthCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 10 * 60 };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const intentRaw = (url.searchParams.get("intent") ?? "login") as GoogleOAuthIntent;
  const intent: GoogleOAuthIntent =
    intentRaw === "register" || intentRaw === "link" ? intentRaw : "login";
  const returnTo = safeInternalPath(url.searchParams.get("returnTo") ?? url.searchParams.get("callbackUrl"));

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL(`/login?google=oauth_not_configured`, url.origin));
  }

  const ip = clientIpForRateLimit(req);
  if (!(await checkDistributedRateLimit(`google-oauth:${ip}`, 20, 15 * 60 * 1000))) {
    return NextResponse.redirect(new URL(`/login?google=generic`, url.origin));
  }

  if (intent === "link") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL(`/login?google=generic&callbackUrl=${encodeURIComponent(returnTo)}`, url.origin));
    }
  }

  try {
    const started = await buildGoogleAuthorizationUrl({ intent, returnTo });
    const res = NextResponse.redirect(started.url);
    res.cookies.set(GOOGLE_OAUTH_COOKIE, started.cookieValue, oauthCookieOptions());
    return res;
  } catch {
    return NextResponse.redirect(new URL(`/login?google=oauth_not_configured`, url.origin));
  }
}

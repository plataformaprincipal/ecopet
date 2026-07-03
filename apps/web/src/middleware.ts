import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/edge/session";
import { requiresAuth } from "@/lib/edge/routes";
import { canAccessWithAccountStatus } from "@/lib/edge/account-status";
import { requiresAuthoritativeStatus } from "@/lib/edge/authoritative-status";
import {
  canAccessRoute,
  getDefaultDashboardPath,
  type AppRole,
} from "@/lib/edge/permissions";
import type { AccountStatus } from "@/lib/edge/types";

function loginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

function dashboardRedirect(request: NextRequest, role: AppRole) {
  return NextResponse.redirect(new URL(getDefaultDashboardPath(role), request.url));
}

async function fetchAuthoritativeStatus(request: NextRequest, token: string) {
  const checkUrl = new URL("/api/auth/session-check", request.url);
  const res = await fetch(checkUrl, {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (!body?.success) return null;
  return {
    role: body.data.role as AppRole,
    accountStatus: body.data.accountStatus as AccountStatus,
    setCookie: res.headers.get("set-cookie"),
  };
}

function applyRefreshedCookie(response: NextResponse, setCookie: string | null) {
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname === "/" && token) {
    try {
      await verifySessionToken(token);
      return applyRefreshedCookie(
        NextResponse.redirect(new URL("/inicio", request.url)),
        null
      );
    } catch {
      /* token inválido — visitante vê landing */
    }
  }

  let role: AppRole | null = null;
  let accountStatus: AccountStatus | null = null;
  let refreshedCookie: string | null = null;

  if (token) {
    try {
      if (requiresAuthoritativeStatus(pathname)) {
        const authoritative = await fetchAuthoritativeStatus(request, token);
        if (authoritative) {
          role = authoritative.role;
          accountStatus = authoritative.accountStatus;
          refreshedCookie = authoritative.setCookie;
        }
      }

      if (!role || !accountStatus) {
        const jwt = await verifySessionToken(token);
        role = jwt.role;
        accountStatus = jwt.accountStatus;
      }

      const statusAccess = canAccessWithAccountStatus(role, accountStatus, pathname);
      if (!statusAccess.allowed && statusAccess.redirectTo) {
        return applyRefreshedCookie(
          NextResponse.redirect(new URL(statusAccess.redirectTo, request.url)),
          refreshedCookie
        );
      }
    } catch {
      /* token inválido */
    }
  }

  if (pathname === "/inicio") {
    if (!token || !role) {
      return loginRedirect(request, pathname);
    }
    if (!canAccessRoute(role, pathname)) {
      return applyRefreshedCookie(dashboardRedirect(request, role), refreshedCookie);
    }
    return applyRefreshedCookie(
      NextResponse.redirect(
        new URL(role === "CLIENT" ? "/client" : "/feed", request.url)
      ),
      refreshedCookie
    );
  }

  if (!requiresAuth(pathname)) {
    return applyRefreshedCookie(NextResponse.next(), refreshedCookie);
  }

  if (!token || !role) {
    return loginRedirect(request, pathname);
  }

  if (!canAccessRoute(role, pathname)) {
    return applyRefreshedCookie(dashboardRedirect(request, role), refreshedCookie);
  }

  return applyRefreshedCookie(NextResponse.next(), refreshedCookie);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2|ttf|otf)$).*)",
  ],
};

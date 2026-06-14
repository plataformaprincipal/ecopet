import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { requiresAuth } from "@/lib/auth/routes";
import { canAccessWithAccountStatus } from "@/lib/account-status";
import { requiresAuthoritativeStatus } from "@/lib/account-status-server";
import {
  canAccessRoute,
  getDefaultDashboardPath,
  type AppRole,
} from "@/lib/permissions";
import type { AccountStatus } from "@prisma/client";

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
        role = jwt.role as AppRole;
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

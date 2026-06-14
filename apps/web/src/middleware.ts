import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { isPublicPath, requiresAuth } from "@/lib/auth/routes";
import {
  canAccessRoute,
  getDefaultDashboardPath,
  type AppRole,
} from "@/lib/permissions";

function loginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

function dashboardRedirect(request: NextRequest, role: AppRole) {
  return NextResponse.redirect(new URL(getDefaultDashboardPath(role), request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return loginRedirect(request, pathname);
  }

  try {
    const { role } = await verifySessionToken(token);
    const appRole = role as AppRole;

    if (!canAccessRoute(appRole, pathname)) {
      return dashboardRedirect(request, appRole);
    }

    return NextResponse.next();
  } catch {
    return loginRedirect(request, pathname);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

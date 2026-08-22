import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySessionToken,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth-session";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";

/** Sessão EcoPet (cookie ecopet-session) — sempre JSON, nunca HTML. */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      await verifySessionToken(token);
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const response = NextResponse.json({
      authenticated: true,
      user: sanitizeUser(user),
    });
    const refreshed = await createSessionToken(user.id, user.email, user.role, user.accountStatus);
    response.cookies.set(SESSION_COOKIE, refreshed, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "SESSION_ERROR" }, { status: 500 });
  }
}

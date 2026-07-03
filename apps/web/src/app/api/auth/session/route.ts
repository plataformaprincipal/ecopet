import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
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

    return NextResponse.json({
      authenticated: true,
      user: sanitizeUser(user),
    });
  } catch {
    return NextResponse.json({ error: "SESSION_ERROR" }, { status: 500 });
  }
}

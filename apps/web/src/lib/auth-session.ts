import { SignJWT, jwtVerify } from "jose";
import type { AccountStatus, UserRole } from "@prisma/client";
import { resolveAuthSecret } from "@/lib/auth-secret";
import { isProductionHttps } from "@/lib/app-url";

export const SESSION_COOKIE = "ecopet-session";

const secret = () => new TextEncoder().encode(resolveAuthSecret());

/** Cookie Secure em deploy HTTPS (Vercel ou URL pública https://). */
function sessionCookieSecure(): boolean {
  // Nunca permitir cookie inseguro em produção (mesmo com flag de debug).
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    if (process.env.FORCE_INSECURE_SESSION_COOKIE === "1") {
      console.warn(
        "[auth] FORCE_INSECURE_SESSION_COOKIE ignorado em produção — cookie permanece Secure."
      );
    }
    return true;
  }
  if (process.env.FORCE_INSECURE_SESSION_COOKIE === "1") return false;
  if (isProductionHttps()) return true;

  const appUrl = (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    ""
  ).toLowerCase();

  if (appUrl.startsWith("http://")) return false;
  if (appUrl.startsWith("https://")) return true;

  return false;
}

export async function createSessionToken(
  userId: string,
  email: string,
  role: UserRole,
  accountStatus: AccountStatus = "ACTIVE"
): Promise<string> {
  return new SignJWT({ userId, id: userId, email, role, accountStatus })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<{
  userId: string;
  id: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
}> {
  const { payload } = await jwtVerify(token, secret());
  const userId = payload.userId ?? payload.id;
  const email = payload.email;
  const role = payload.role;
  const accountStatus = payload.accountStatus;
  if (typeof userId !== "string" || typeof role !== "string") {
    throw new Error("Token inválido");
  }
  return {
    userId,
    id: userId,
    email: typeof email === "string" ? email : "",
    role: role as UserRole,
    accountStatus: (typeof accountStatus === "string"
      ? accountStatus
      : "ACTIVE") as AccountStatus,
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

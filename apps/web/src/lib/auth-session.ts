import { SignJWT, jwtVerify } from "jose";
import type { AccountStatus, UserRole } from "@prisma/client";
import { resolveAuthSecret } from "@/lib/auth-secret";

export const SESSION_COOKIE = "ecopet-session";

const secret = () => new TextEncoder().encode(resolveAuthSecret());

/** Cookie Secure apenas em deploy HTTPS real — evita quebrar login em http://localhost com next start. */
function sessionCookieSecure(): boolean {
  if (process.env.FORCE_INSECURE_SESSION_COOKIE === "1") return false;

  const appUrl = (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    ""
  ).toLowerCase();

  if (appUrl.startsWith("http://")) return false;
  if (appUrl.startsWith("https://")) return true;

  // Vercel/produção sem URL explícita: HTTPS na borda
  return process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL);
}

export async function createSessionToken(
  userId: string,
  role: UserRole,
  accountStatus: AccountStatus = "ACTIVE"
): Promise<string> {
  return new SignJWT({ userId, role, accountStatus })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<{
  userId: string;
  role: UserRole;
  accountStatus: AccountStatus;
}> {
  const { payload } = await jwtVerify(token, secret());
  const userId = payload.userId;
  const role = payload.role;
  const accountStatus = payload.accountStatus;
  if (typeof userId !== "string" || typeof role !== "string") {
    throw new Error("Token inválido");
  }
  return {
    userId,
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
    maxAge: 60 * 60 * 24 * 7,
  };
}

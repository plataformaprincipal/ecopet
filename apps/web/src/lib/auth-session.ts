import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "ecopet-session";

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || "ecopet-dev-auth-secret-change-me");

export async function createSessionToken(userId: string, role: UserRole): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<{ userId: string; role: UserRole }> {
  const { payload } = await jwtVerify(token, secret());
  const userId = payload.userId;
  const role = payload.role;
  if (typeof userId !== "string" || typeof role !== "string") {
    throw new Error("Token inválido");
  }
  return { userId, role: role as UserRole };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

/**
 * Verificação de sessão JWT para Edge Runtime (middleware).
 * Sem Prisma, server-only ou lib/env — apenas jose + process.env.
 */
import { jwtVerify } from "jose";
import { resolveAuthSecret } from "@/lib/auth-secret";
import type { AccountStatus, AppRole } from "@/lib/edge/types";

export const SESSION_COOKIE = "ecopet-session";

function sessionSecret(): Uint8Array {
  return new TextEncoder().encode(resolveAuthSecret());
}

export async function verifySessionToken(token: string): Promise<{
  userId: string;
  role: AppRole;
  accountStatus: AccountStatus;
}> {
  const { payload } = await jwtVerify(token, sessionSecret());
  const userId = payload.userId;
  const role = payload.role;
  const accountStatus = payload.accountStatus;
  if (typeof userId !== "string" || typeof role !== "string") {
    throw new Error("Token inválido");
  }
  return {
    userId,
    role: role as AppRole,
    accountStatus: (typeof accountStatus === "string"
      ? accountStatus
      : "ACTIVE") as AccountStatus,
  };
}

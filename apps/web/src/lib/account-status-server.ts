import type { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuthoritativeAccount = {
  userId: string;
  role: UserRole;
  accountStatus: AccountStatus;
};

export async function getAuthoritativeAccountStatus(
  userId: string
): Promise<AuthoritativeAccount | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, accountStatus: true },
  });
  if (!user) return null;
  return {
    userId: user.id,
    role: user.role,
    accountStatus: user.accountStatus,
  };
}

/** Prefixos que exigem status autoritativo do banco no middleware. */
export const AUTHORITATIVE_STATUS_PREFIXES = [
  "/dashboard",
  "/api/client",
  "/api/partner",
  "/api/admin",
  "/meu-pet",
  "/agenda",
  "/marketplace",
  "/pedidos",
  "/adocao",
  "/ong",
] as const;

export function requiresAuthoritativeStatus(pathname: string): boolean {
  return AUTHORITATIVE_STATUS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

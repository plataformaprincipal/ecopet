import type { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AUTHORITATIVE_STATUS_PREFIXES,
  requiresAuthoritativeStatus,
} from "@/lib/edge/authoritative-status";

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

export { AUTHORITATIVE_STATUS_PREFIXES, requiresAuthoritativeStatus };

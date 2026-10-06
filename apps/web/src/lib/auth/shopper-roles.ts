import { UserRole } from "@prisma/client";

export const SHOPPER_ROLES: UserRole[] = [
  UserRole.CLIENT,
  UserRole.TUTOR,
  UserRole.PARTNER,
  UserRole.ONG,
];

export function canShop(role: string): boolean {
  return SHOPPER_ROLES.includes(role as UserRole);
}

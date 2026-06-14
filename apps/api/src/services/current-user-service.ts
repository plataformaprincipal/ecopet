import { prisma } from "@ecopet/database";
import { UserRole } from "@prisma/client";
import { ROLE_REDIRECTS } from "../schemas/register-schemas.js";

export const CURRENT_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  accountStatus: true,
  accountStatusReason: true,
  avatar: true,
  bio: true,
  username: true,
  phone: true,
  cpf: true,
  mustChangePassword: true,
  firstLoginRequired: true,
  isBootstrapUser: true,
  isMasterAdmin: true,
  isOrgAdmin: true,
  isVerified: true,
  isPremium: true,
  badges: true,
  preferences: true,
  createdAt: true,
  pets: { select: { id: true, name: true, photo: true, species: true } },
  gamification: true,
  addressRecord: {
    select: {
      street: true,
      number: true,
      complement: true,
      district: true,
      city: true,
      state: true,
      zipCode: true,
      latitude: true,
      longitude: true,
    },
  },
} as const;

export async function getCurrentUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: CURRENT_USER_SELECT,
  });
}

export function resolvePostAuthRedirect(user: {
  role: string;
  firstLoginRequired?: boolean;
  mustChangePassword?: boolean;
  accountStatus?: string;
}): string {
  if (user.role === UserRole.GESTOR || user.role === UserRole.ADMIN) {
    return user.firstLoginRequired || user.mustChangePassword ? "/gestor/alterar-senha" : "/gestor";
  }

  const roleKey = user.role as keyof typeof ROLE_REDIRECTS;
  if (roleKey in ROLE_REDIRECTS) {
    return ROLE_REDIRECTS[roleKey];
  }

  return "/dashboard";
}

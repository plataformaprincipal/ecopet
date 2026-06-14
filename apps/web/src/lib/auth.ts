import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from "@/lib/auth-session";

export {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from "@/lib/auth-session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  cnpj: true,
  phone: true,
  birthDate: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  partnerProfile: {
    select: {
      id: true,
      businessName: true,
      legalName: true,
      cnpj: true,
      category: true,
      commercialEmail: true,
      responsibleName: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      description: true,
      businessHours: true,
      verificationStatus: true,
    },
  },
  ongProfile: {
    select: {
      id: true,
      ongName: true,
      cnpj: true,
      responsibleName: true,
      institutionalEmail: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      description: true,
      focusArea: true,
      verificationStatus: true,
    },
  },
} as const;

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { userId } = await verifySessionToken(token);
    return prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });
  } catch {
    return null;
  }
}

export type SafeUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function sanitizeUser(user: SafeUser) {
  return user;
}

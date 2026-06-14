import { prisma } from "@/lib/prisma";

export const profileSelect = {
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
      createdAt: true,
      updatedAt: true,
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
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

export type ProfileData = NonNullable<
  Awaited<ReturnType<typeof getProfileByUserId>>
>;

export async function getProfileByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
}

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

export function serializeProfile(user: ProfileData) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    birthDate: formatDate(user.birthDate),
    address: user.address,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode,
    avatarUrl: user.avatarUrl,
    partnerProfile: user.partnerProfile,
    ongProfile: user.ongProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

import type { SocialPostType, UserRole } from "@prisma/client";
import type { SocialUser } from "@/lib/social/permissions";

export type SocialPersona = UserRole | "VISITOR";

export const SOCIAL_POST_TYPES = [
  "PET_UPDATE",
  "GENERAL",
  "PRODUCT",
  "SERVICE",
  "ADOPTION",
  "CAMPAIGN",
  "DONATION",
  "EVENT",
  "RESCUE",
  "EDUCATIONAL",
  "URGENT",
] as const satisfies readonly SocialPostType[];

const CLIENT_TYPES: SocialPostType[] = ["PET_UPDATE", "GENERAL", "EDUCATIONAL"];
const PARTNER_TYPES: SocialPostType[] = ["GENERAL", "PRODUCT", "SERVICE", "EDUCATIONAL", "EVENT"];
const ONG_TYPES: SocialPostType[] = [
  "GENERAL",
  "ADOPTION",
  "CAMPAIGN",
  "DONATION",
  "EVENT",
  "RESCUE",
  "EDUCATIONAL",
  "URGENT",
];
const ADMIN_TYPES: SocialPostType[] = [...SOCIAL_POST_TYPES];

const ROLE_ALLOWED_TYPES: Record<UserRole, SocialPostType[]> = {
  CLIENT: CLIENT_TYPES,
  PARTNER: PARTNER_TYPES,
  ONG: ONG_TYPES,
  ADMIN: ADMIN_TYPES,
  TUTOR: CLIENT_TYPES,
  VETERINARIAN: CLIENT_TYPES,
  CLINIC: PARTNER_TYPES,
  PETSHOP: PARTNER_TYPES,
  SELLER: PARTNER_TYPES,
  SERVICE_PROVIDER: PARTNER_TYPES,
  GESTOR: ADMIN_TYPES,
  DELIVERY: [],
  INFLUENCER: ["GENERAL", "EDUCATIONAL", "PET_UPDATE"],
};

export function toSocialPersona(user: SocialUser | null | undefined): SocialPersona {
  if (!user) return "VISITOR";
  return user.role;
}

export function canInteract(user: SocialUser | null | undefined): boolean {
  if (!user) return false;
  return user.accountStatus === "ACTIVE";
}

export function canModerateSocial(user: SocialUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" && user.accountStatus === "ACTIVE";
}

export function canCreateSocialPost(user: SocialUser | null | undefined, type: SocialPostType = "GENERAL"): boolean {
  if (!canInteract(user) || !user) return false;
  const allowed = ROLE_ALLOWED_TYPES[user.role] ?? [];
  return allowed.includes(type);
}

export function canCreateAdoptionPost(user: SocialUser | null | undefined): boolean {
  return canCreateSocialPost(user, "ADOPTION");
}

export function canCreateProductPost(user: SocialUser | null | undefined): boolean {
  return canCreateSocialPost(user, "PRODUCT");
}

export function canCreateServicePost(user: SocialUser | null | undefined): boolean {
  return canCreateSocialPost(user, "SERVICE");
}

export function canCreateCampaignPost(user: SocialUser | null | undefined): boolean {
  return canCreateSocialPost(user, "CAMPAIGN");
}

export function getAllowedPostTypes(user: SocialUser | null | undefined): SocialPostType[] {
  if (!canInteract(user) || !user) return [];
  return ROLE_ALLOWED_TYPES[user.role] ?? [];
}

export function assertCanCreatePostType(user: SocialUser, type: SocialPostType): void {
  if (!canCreateSocialPost(user, type)) {
    throw new Error(`Perfil ${user.role} não pode criar publicação do tipo ${type}.`);
  }
}

export function canViewPublicFeed(): boolean {
  return true;
}

export function canRequestAdoption(user: SocialUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "CLIENT" && user.accountStatus === "ACTIVE";
}

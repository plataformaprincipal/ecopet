import type { ProfileCategory, PartnerSubtype, SmartProfileData } from "./types";
import { MODULES_BY_CATEGORY } from "./config";
import { resolveProfile } from "./role-mapper";

export function getSmartProfile(
  category: ProfileCategory,
  partnerSubtype: PartnerSubtype = "PETSHOP"
): SmartProfileData {
  const modules = MODULES_BY_CATEGORY[category];
  return {
    category,
    partnerSubtype: category === "PARTNER" ? partnerSubtype : undefined,
    name: "",
    avatar: "",
    coverImage: "",
    bio: "",
    location: "",
    subtitle: "",
    isVerified: false,
    isPremium: false,
    badges: [],
    metrics: [],
    modules,
  };
}

export function getProfileForRole(role?: string): SmartProfileData {
  return resolveProfile({ role });
}

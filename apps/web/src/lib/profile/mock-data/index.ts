import type { ProfileCategory, PartnerSubtype, SmartProfileData } from "../types";
import { MODULES_BY_CATEGORY } from "../config";
import { resolveProfile } from "../role-mapper";
import { CLIENT_PROFILE } from "./client.mock";
import { PARTNER_PROFILES } from "./partner.mock";
import { NGO_PROFILE } from "./ngo.mock";

export function getSmartProfile(
  category: ProfileCategory,
  partnerSubtype: PartnerSubtype = "PETSHOP"
): SmartProfileData {
  const modules = MODULES_BY_CATEGORY[category];

  if (category === "CLIENT") {
    return { category: "CLIENT", ...CLIENT_PROFILE, modules };
  }

  if (category === "NGO") {
    return { category: "NGO", ...NGO_PROFILE, modules };
  }

  const partner = PARTNER_PROFILES[partnerSubtype] ?? PARTNER_PROFILES.PETSHOP;
  return {
    category: "PARTNER",
    partnerSubtype,
    name: partner.name,
    avatar: partner.avatar,
    coverImage: partner.coverImage,
    bio: partner.bio,
    location: partner.location,
    subtitle: partner.subtitle,
    isVerified: true,
    isPremium: partnerSubtype === "SELLER" || partnerSubtype === "CLINIC",
    badges: ["Verificado", "Parceiro ECOPET"],
    metrics: [
      { label: "Faturamento", value: "R$ 145k" },
      { label: "Avaliação", value: "4.92 ★" },
      { label: "Pedidos", value: 189 },
      { label: "Equipe", value: 12 },
    ],
    modules,
  };
}

export function getProfileForRole(role?: string): SmartProfileData {
  return resolveProfile({ role });
}

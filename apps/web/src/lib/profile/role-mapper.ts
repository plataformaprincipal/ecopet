import type { ProfileCategory, PartnerSubtype, SmartProfileData } from "./types";
import { getSmartProfile } from "./mock-data";

const PARTNER_ROLES: Record<string, PartnerSubtype> = {
  VETERINARIAN: "VETERINARIAN",
  CLINIC: "CLINIC",
  PETSHOP: "PETSHOP",
  SELLER: "SELLER",
  SERVICE_PROVIDER: "SERVICE_PROVIDER",
  ADMIN: "COMPANY",
  COMPANY: "COMPANY",
  DISTRIBUTOR: "DISTRIBUTOR",
  AGRO: "AGRO",
  FRANCHISE: "FRANCHISE",
  MARKETPLACE: "MARKETPLACE",
};

export function mapRoleToCategory(role?: string): ProfileCategory {
  const r = role?.toUpperCase() ?? "TUTOR";
  if (r === "ONG") return "NGO";
  if (r === "TUTOR" || r === "CLIENT") return "CLIENT";
  return "PARTNER";
}

export function mapRoleToPartnerSubtype(role?: string): PartnerSubtype {
  const r = role?.toUpperCase() ?? "PETSHOP";
  return PARTNER_ROLES[r] ?? "PETSHOP";
}

export interface ProfileResolveOptions {
  role?: string;
  category?: string | null;
  subtype?: string | null;
}

export function resolveProfile(options: ProfileResolveOptions): SmartProfileData {
  const categoryParam = options.category?.toUpperCase() as ProfileCategory | undefined;
  const subtypeParam = options.subtype?.toUpperCase() as PartnerSubtype | undefined;

  if (categoryParam === "CLIENT" || categoryParam === "PARTNER" || categoryParam === "NGO") {
    return getSmartProfile(categoryParam, subtypeParam);
  }

  const category = mapRoleToCategory(options.role);
  const subtype = category === "PARTNER" ? mapRoleToPartnerSubtype(options.role) : undefined;
  return getSmartProfile(category, subtype);
}

export const CATEGORY_LABELS: Record<ProfileCategory, string> = {
  CLIENT: "Cliente",
  PARTNER: "Parceiro",
  NGO: "ONG",
};

export const PARTNER_SUBTYPE_LABELS: Record<PartnerSubtype, string> = {
  PETSHOP: "Pet Shop",
  VETERINARIAN: "Veterinário",
  CLINIC: "Clínica Veterinária",
  SELLER: "Seller / Loja",
  SERVICE_PROVIDER: "Prestador de Serviço",
  COMPANY: "Empresa",
  DISTRIBUTOR: "Distribuidor",
  AGRO: "Agro",
  FRANCHISE: "Franquia",
  MARKETPLACE: "Marketplace Parceiro",
};

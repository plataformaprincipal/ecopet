import { ECCOPET_SELLER_ID } from "@/lib/cart/universal";

/**
 * Sellers that receive via Mercado Pago Connect / split 1:1.
 * EccoPet/ADMIN/platform catalog never belongs here.
 */
export const EXTERNAL_MARKETPLACE_ROLES = [
  "PARTNER",
  "ONG",
  "CLINIC",
  "PETSHOP",
  "SELLER",
  "SERVICE_PROVIDER",
  "VETERINARIAN",
] as const;

export function isExternalMarketplaceRole(role: string | null | undefined): boolean {
  return (EXTERNAL_MARKETPLACE_ROLES as readonly string[]).includes(role ?? "");
}

export function isPlatformSellerId(sellerId: string | null | undefined): boolean {
  return sellerId == null || sellerId === "" || sellerId === ECCOPET_SELLER_ID;
}

/**
 * OAuth CONNECTED / split gate applies only to external marketplace sellers.
 * Platform, ADMIN and EccoPet-owned items use the EccoPet LIVE Mercado Pago account.
 */
export function requiresExternalSellerGate(params: {
  sellerId?: string | null;
  role?: string | null;
}): boolean {
  if (isPlatformSellerId(params.sellerId)) return false;
  if (params.role != null && !isExternalMarketplaceRole(params.role)) return false;
  return true;
}

export function cartSellerIdentity(params: {
  sellerId: string | null | undefined;
  role?: string | null;
}): { sellerId: string; sellerType: "ECCOPET" | "PARTNER" | "ONG" } {
  if (!requiresExternalSellerGate(params)) {
    return { sellerId: ECCOPET_SELLER_ID, sellerType: "ECCOPET" };
  }
  return {
    sellerId: params.sellerId as string,
    sellerType: params.role === "ONG" ? "ONG" : "PARTNER",
  };
}

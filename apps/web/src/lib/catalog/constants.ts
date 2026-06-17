export const CATALOG_PARTNER_EMAIL = "catalogo@ecopet.local";
export const CATALOG_PARTNER_CNPJ = "11222333000181";
export const CATALOG_PARTNER_NAME = "EcoPet Oficial";

export const CATALOG_PRODUCT_SKUS = [
  "ECOPET-ACC-CAMISA",
  "ECOPET-ACC-BRINQUEDO",
  "ECOPET-ACC-CAMA",
  "ECOPET-FOOD-CAO-10KG",
  "ECOPET-FOOD-GATO-3KG",
  "ECOPET-HIG-TAPETE",
  "ECOPET-HIG-FRALDA",
] as const;

export const CATALOG_SERVICE_KEYS = ["ecopet-svc-banho", "ecopet-svc-tosa"] as const;

export function isInstitutionalCatalogUser(user: {
  email?: string | null;
  isBootstrapUser?: boolean;
  preferences?: unknown;
}): boolean {
  if (user.email === CATALOG_PARTNER_EMAIL) return true;
  const prefs = user.preferences as { institutionalCatalogPartner?: boolean } | null;
  return Boolean(user.isBootstrapUser && prefs?.institutionalCatalogPartner);
}

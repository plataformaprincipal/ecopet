/** Catálogo institucional EcoPet Oficial — imagens estáticas e textos alt. */
export const CATALOG_IMAGE_BASE = "/catalog/ecopet-oficial";

export type CatalogImageMeta = { url: string; alt: string };

export const CATALOG_PRODUCT_IMAGES: Record<string, CatalogImageMeta> = {
  "ECOPET-ACC-CAMISA": {
    url: `${CATALOG_IMAGE_BASE}/camiseta-pet.svg`,
    alt: "Camiseta pet básica confortável para cães e gatos de pequeno e médio porte",
  },
  "ECOPET-ACC-BRINQUEDO": {
    url: `${CATALOG_IMAGE_BASE}/brinquedo-mordedor.svg`,
    alt: "Brinquedo mordedor interativo de borracha para cães",
  },
  "ECOPET-ACC-CAMA": {
    url: `${CATALOG_IMAGE_BASE}/cama-pet.svg`,
    alt: "Cama pet almofadada lavável para cães e gatos",
  },
  "ECOPET-FOOD-CAO-10KG": {
    url: `${CATALOG_IMAGE_BASE}/racao-caes.svg`,
    alt: "Saco de ração seca premium para cães adultos",
  },
  "ECOPET-FOOD-GATO-3KG": {
    url: `${CATALOG_IMAGE_BASE}/racao-gatos.svg`,
    alt: "Saco de ração seca premium para gatos adultos",
  },
  "ECOPET-HIG-TAPETE": {
    url: `${CATALOG_IMAGE_BASE}/tapete-higienico.svg`,
    alt: "Pacote de tapete higiênico superabsorvente para cães",
  },
  "ECOPET-HIG-FRALDA": {
    url: `${CATALOG_IMAGE_BASE}/fralda-pet.svg`,
    alt: "Fralda pet descartável ajustável para cães e gatos",
  },
};

export const CATALOG_SERVICE_IMAGES: Record<string, CatalogImageMeta> = {
  "ecopet-svc-banho": {
    url: `${CATALOG_IMAGE_BASE}/banho-pet.svg`,
    alt: "Serviço de banho pet com agendamento para cães e gatos",
  },
  "ecopet-svc-tosa": {
    url: `${CATALOG_IMAGE_BASE}/tosa-pet.svg`,
    alt: "Serviço de tosa pet com agendamento para cães e gatos",
  },
};

export function productImageFromCatalog(sku: string | null | undefined, images?: unknown): CatalogImageMeta | null {
  if (sku && CATALOG_PRODUCT_IMAGES[sku]) return CATALOG_PRODUCT_IMAGES[sku];
  const first = Array.isArray(images) ? images[0] : null;
  if (typeof first === "string" && first.startsWith("/catalog/")) {
    return { url: first, alt: "" };
  }
  return null;
}

export function resolveProductAlt(
  name: string,
  sku?: string | null,
  shortDescription?: string | null,
  extraDetails?: unknown
): string {
  const fromSku = sku ? CATALOG_PRODUCT_IMAGES[sku]?.alt : undefined;
  if (fromSku) return fromSku;
  const extra = extraDetails as { imageAlt?: string } | null;
  if (extra?.imageAlt) return extra.imageAlt;
  if (shortDescription?.trim()) return `${name}: ${shortDescription.trim()}`;
  return `${name} disponível no catálogo EcoPet`;
}

export function resolveServiceAlt(
  name: string,
  catalogKey?: string | null,
  shortDescription?: string | null,
  extraDetails?: unknown
): string {
  const fromKey = catalogKey ? CATALOG_SERVICE_IMAGES[catalogKey]?.alt : undefined;
  if (fromKey) return fromKey;
  const extra = extraDetails as { catalogKey?: string; imageAlt?: string } | null;
  if (extra?.catalogKey && CATALOG_SERVICE_IMAGES[extra.catalogKey]?.alt) {
    return CATALOG_SERVICE_IMAGES[extra.catalogKey].alt;
  }
  if (extra?.imageAlt) return extra.imageAlt;
  if (shortDescription?.trim()) return `${name}: ${shortDescription.trim()}`;
  const lower = name.toLowerCase();
  if (lower.includes("banho")) return "Serviço de banho pet com agendamento para cães e gatos";
  if (lower.includes("tosa")) return "Serviço de tosa pet com agendamento para cães e gatos";
  return `${name} com agendamento online no EcoPet`;
}

export function firstProductImageUrl(images?: unknown): string | null {
  if (!Array.isArray(images) || !images.length) return null;
  const url = images[0];
  return typeof url === "string" ? url : null;
}

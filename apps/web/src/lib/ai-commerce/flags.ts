/**
 * Feature flag, monetização e SKUs oficiais do ecossistema EccoPet AI (13 produtos).
 * Commerce (checkout) permanece fail-closed até AI_COMMERCE_ENABLED=1.
 * Ferramentas gratuitas usam AI_MONETIZATION_MODE=FREE_BETA (default).
 */
type EnvLike = Record<string, string | undefined>;

function parseFlag(raw: string | undefined, defaultOn: boolean): boolean {
  if (raw === undefined || raw === "") return defaultOn;
  const v = String(raw).trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return false;
}

export function isAiCommerceEnabled(env: EnvLike = process.env): boolean {
  return parseFlag(env.AI_COMMERCE_ENABLED, false);
}

export function areAiCommercePricesConfirmed(env: EnvLike = process.env): boolean {
  return parseFlag(env.AI_COMMERCE_PRICES_CONFIRMED, false);
}

export function assertAiCommerceEnabled(env: EnvLike = process.env): void {
  if (!isAiCommerceEnabled(env)) {
    const err = new Error("AI_COMMERCE_DISABLED");
    err.name = "AiCommerceDisabledError";
    throw err;
  }
}

export const AI_MONETIZATION_MODES = ["FREE_BETA", "PAID"] as const;
export type AiMonetizationMode = (typeof AI_MONETIZATION_MODES)[number];

/** Fonte canônica: backend decide. Default FREE_BETA. */
export function getAiMonetizationMode(env: EnvLike = process.env): AiMonetizationMode {
  const raw = String(env.AI_MONETIZATION_MODE ?? "").trim().toUpperCase();
  if (raw === "PAID") return "PAID";
  return "FREE_BETA";
}

export function isAiMonetizationFree(env: EnvLike = process.env): boolean {
  return getAiMonetizationMode(env) === "FREE_BETA";
}

/** Checkout de DIGITAL_AI só no modo PAID e com a flag comercial ligada. */
export function isAiPaidCheckoutEnabled(env: EnvLike = process.env): boolean {
  return getAiMonetizationMode(env) === "PAID" && isAiCommerceEnabled(env);
}

export function assertAiPaidCheckoutEnabled(env: EnvLike = process.env): void {
  if (isAiMonetizationFree(env)) {
    const err = new Error("AI_FREE_BETA");
    err.name = "AiFreeBetaError";
    throw err;
  }
  assertAiCommerceEnabled(env);
}

export const AI_ENTITLEMENT_SOURCE_PURCHASE = "PURCHASE" as const;
export const AI_ENTITLEMENT_SOURCE_FREE_BETA = "FREE_BETA" as const;

export const AI_COMMERCE_ITEM_TYPE = "DIGITAL_AI" as const;

export const AI_COMMERCE_SKUS = {
  ECCOVET: "AI_ECCOVET",
  TRIAGE: "AI_ECCOVET_TRIAGE",
  REPORT: "AI_ECCOVET_REPORT",
  EXAMS: "AI_ECCOVET_EXAMS",
  VISION: "AI_ECCOVET_VISION",
  NUTRI: "AI_ECCONUTRI",
  PESO: "AI_ECCOPESO",
  DENTAL: "AI_ECCODENTAL",
  BEHAVIOR: "AI_ECCOBEHAVIOR",
  VACCINE: "AI_ECCOVACCINE",
  MED: "AI_ECCOMED",
  CHECKUP: "AI_ECCOCHECKUP",
  HEALTH_PROFILE: "AI_PET_HEALTH_PROFILE",
} as const;

export type AiCommerceSku = (typeof AI_COMMERCE_SKUS)[keyof typeof AI_COMMERCE_SKUS];

export const AI_COMMERCE_SKU_LIST: AiCommerceSku[] = Object.values(AI_COMMERCE_SKUS);

/** SKU legado da v1 (EccoLab) — redireciona para EccoVet Exames. */
export const AI_COMMERCE_LEGACY_SKU_MAP: Record<string, AiCommerceSku> = {
  AI_ECCOLAB: AI_COMMERCE_SKUS.EXAMS,
};

export function canonicalAiCommerceSku(sku: string): string {
  return AI_COMMERCE_LEGACY_SKU_MAP[sku] ?? sku;
}

export function isAiCommerceSku(sku: string): sku is AiCommerceSku {
  const canonical = canonicalAiCommerceSku(sku);
  return (AI_COMMERCE_SKU_LIST as string[]).includes(canonical);
}

export const PUBLIC_AI_PRODUCT_SLUGS = [
  "vet",
  "triagem",
  "relatorio",
  "exames",
  "vision",
  "nutri",
  "peso",
  "dental",
  "behavior",
  "vacina",
  "med",
  "checkup",
  "health-profile",
  "lab",
] as const;

export const PUBLIC_AI_PRODUCT_PATH_RE =
  /^\/eccopet\/(vet|triagem|relatorio|exames|vision|nutri|peso|dental|behavior|vacina|med|checkup|health-profile|lab)$/;

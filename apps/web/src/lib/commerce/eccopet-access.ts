import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { canonicalAiCommerceSku, isAiCommerceSku } from "@/lib/ai-commerce/flags";
import { getCommercialProduct } from "@/lib/commerce-catalog/products";
import { isPlatformSellerId } from "@/lib/seller/platform";

const DIGITAL_ITEM_TYPES = new Set([
  "DIGITAL_AI",
  "CATALOG_SKU",
  "AI_PRODUCT",
  "AI_CREDIT",
  "ONE_PLAN",
  "PRO_PLAN",
  "PARTNER_MODULE",
  "CLINICAL_MODULE",
  "DIGITAL_PRODUCT",
]);

const CTA_OVERRIDE: Record<string, string> = {
  AI_ECCOVET: "Usar EccoVet",
  AI_ECCOVET_TRIAGE: "Fazer triagem",
  AI_ECCOVET_REPORT: "Criar relatório",
  AI_ECCOVET_EXAMS: "Analisar exames",
  AI_ECCOVET_VISION: "Analisar foto",
  AI_ECCONUTRI: "Acessar EccoNutri",
  AI_ECCOPESO: "Acessar EccoPeso",
  AI_ECCODENTAL: "Acessar EccoDental",
  AI_ECCOBEHAVIOR: "Analisar comportamento",
  AI_ECCOVACCINE: "Revisar vacinas",
  AI_ECCOMED: "Revisar medicamentos",
  AI_ECCOCHECKUP: "Abrir EccoCheckup",
  AI_PET_HEALTH_PROFILE: "Acessar Health Profile",
};

export type EccopetAccess = {
  sku: string;
  href: string;
  ctaLabel: string;
  digital: boolean;
  selfFulfilled: boolean;
  family?: string;
};

export type ClientOrderFilter =
  | "all"
  | "awaiting_payment"
  | "access_available"
  | "in_progress"
  | "awaiting_partner"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export const CLIENT_ORDER_FILTERS: Array<{ id: ClientOrderFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "awaiting_payment", label: "Aguardando pagamento" },
  { id: "access_available", label: "Acesso disponível" },
  { id: "in_progress", label: "Em andamento" },
  { id: "awaiting_partner", label: "Aguardando parceiro" },
  { id: "shipped", label: "Enviado" },
  { id: "completed", label: "Concluído" },
  { id: "cancelled", label: "Cancelado" },
  { id: "refunded", label: "Reembolsado" },
];

export function isDigitalEccopetItemType(itemType: string | null | undefined) {
  return DIGITAL_ITEM_TYPES.has(String(itemType || ""));
}

/** IA / planos / módulos EccoPet nunca dependem de aceite de parceiro. */
export function isEccopetSelfFulfilledItem(params: {
  sku?: string | null;
  itemType?: string | null;
  partnerId?: string | null;
  sellerId?: string | null;
}) {
  const sku = params.sku ? canonicalAiCommerceSku(params.sku) : "";
  if (sku && isAiCommerceSku(sku)) return true;

  if (isDigitalEccopetItemType(params.itemType)) {
    const product = sku ? getCommercialProduct(sku) : getCommercialProduct(params.sku ?? "");
    if (product?.requiresLicensedVet || product?.requiresInsurer) return false;
    if (
      product?.partnerPanel &&
      (product.family === "TELEHEALTH" || product.family === "PROTECT" || product.family === "HEALTH_PLAN")
    ) {
      return false;
    }
    return true;
  }

  const owner = params.partnerId || params.sellerId || null;
  if (!owner) return true;
  return isPlatformSellerId(owner);
}

export function resolveEccopetAccess(sku: string | null | undefined): EccopetAccess | null {
  if (!sku) return null;
  const canonical = canonicalAiCommerceSku(sku);
  const ai = getProductDefBySku(canonical);
  if (ai) {
    return {
      sku: canonical,
      href: ai.href,
      ctaLabel: CTA_OVERRIDE[canonical] ?? ai.ctaLabel,
      digital: true,
      selfFulfilled: true,
      family: "AI",
    };
  }
  const catalog = getCommercialProduct(canonical) ?? getCommercialProduct(sku);
  if (catalog) {
    const plan = catalog.family === "ONE" || catalog.family === "PRO";
    return {
      sku: catalog.sku,
      href: catalog.href,
      ctaLabel: plan ? "Acessar meu plano" : catalog.family === "AI_ADDON" ? "Abrir módulo" : "Abrir módulo",
      digital: true,
      selfFulfilled: isEccopetSelfFulfilledItem({ sku: catalog.sku, itemType: "CATALOG_SKU" }),
      family: catalog.family,
    };
  }
  if (isAiCommerceSku(canonical)) {
    return {
      sku: canonical,
      href: "/eccopet",
      ctaLabel: CTA_OVERRIDE[canonical] ?? "Usar agora",
      digital: true,
      selfFulfilled: true,
      family: "AI",
    };
  }
  return null;
}

export function skuToRoute(sku: string | null | undefined): string | null {
  return resolveEccopetAccess(sku)?.href ?? null;
}

export function eccopetFinancialLabel(status: string | null | undefined) {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
    case "PAID":
      return "Pagamento aprovado";
    case "PENDING":
    case "CREATED":
    case "IN_PROCESS":
    case "PROCESSING":
    case "ACTION_REQUIRED":
      return "Aguardando pagamento";
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
    case "ERROR":
      return "Pagamento não aprovado";
    case "REFUNDED":
      return "Reembolsado";
    case "PARTIALLY_REFUNDED":
      return "Reembolso parcial";
    default:
      return status || "Pendente";
  }
}

export function eccopetOperationalLabel(params: {
  paid: boolean;
  selfFulfilled: boolean;
  digital: boolean;
  orderStatus: string;
  entitlementStatus?: string | null;
  releasing?: boolean;
}) {
  const status = String(params.orderStatus || "").toUpperCase();
  if (status === "CANCELLED") return "Cancelado";
  if (status === "REFUNDED") return "Reembolsado";
  if (status === "PARTIALLY_REFUNDED") return "Reembolso parcial";
  if (!params.paid) {
    if (status === "PENDING" || status === "PENDING_CONFIRMATION") return "Aguardando pagamento";
    return eccopetFinancialLabel(status);
  }
  if (params.selfFulfilled) {
    if (params.entitlementStatus === "EXPIRED" || params.entitlementStatus === "CONSUMED") return "Expirado";
    if (params.entitlementStatus === "REVOKED" || params.entitlementStatus === "REFUNDED") return "Acesso revogado";
    if (params.releasing) return "Liberando seu acesso...";
    if (params.digital) return "Pagamento aprovado · acesso liberado";
    return "Pagamento aprovado";
  }
  if (status === "PAID" || status === "PENDING_CONFIRMATION") {
    return "Pagamento aprovado · aguardando confirmação do parceiro";
  }
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "Enviado";
  if (status === "DELIVERED" || status === "COMPLETED" || status === "PICKED_UP") return "Concluído";
  if (status === "CONFIRMED") return "Parceiro aceitou";
  if (status === "PREPARING") return "Preparando";
  return status;
}

export function orderFilterBuckets(params: {
  status: string;
  paid: boolean;
  items: Array<{
    selfFulfilled: boolean;
    accessAvailable: boolean;
    releasing?: boolean;
  }>;
}): ClientOrderFilter[] {
  const status = String(params.status || "").toUpperCase();
  const buckets: ClientOrderFilter[] = ["all"];
  if (status === "CANCELLED") buckets.push("cancelled");
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") buckets.push("refunded");
  if (!params.paid && status !== "CANCELLED" && status !== "REFUNDED") buckets.push("awaiting_payment");
  if (params.items.some((item) => item.selfFulfilled && (item.accessAvailable || item.releasing))) {
    buckets.push("access_available");
  }
  if (params.paid && params.items.some((item) => !item.selfFulfilled) && ["PAID", "PENDING_CONFIRMATION"].includes(status)) {
    buckets.push("awaiting_partner");
  }
  if (["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "READY_PICKUP"].includes(status)) {
    buckets.push("in_progress");
  }
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) buckets.push("shipped");
  if (["DELIVERED", "COMPLETED", "PICKED_UP"].includes(status)) buckets.push("completed");
  return buckets;
}

export function matchesClientOrderFilter(buckets: ClientOrderFilter[], filter: ClientOrderFilter) {
  if (filter === "all") return true;
  return buckets.includes(filter);
}

export function matchesOrderSearch(
  query: string,
  params: {
    orderNumber: number | string;
    items: Array<{ name?: string | null; sku?: string | null; sellerName?: string | null }>;
    sellerName?: string | null;
  }
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (String(params.orderNumber).includes(q)) return true;
  if ((params.sellerName || "").toLowerCase().includes(q)) return true;
  return params.items.some(
    (item) =>
      (item.name || "").toLowerCase().includes(q) ||
      (item.sku || "").toLowerCase().includes(q) ||
      (item.sellerName || "").toLowerCase().includes(q)
  );
}

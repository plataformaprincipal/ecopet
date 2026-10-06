/**
 * Carrinho universal — tipos, agrupamento e partição de pagamento.
 * Split Mercado Pago desta conta é 1:1 (Payments API + application_fee).
 * Multi-seller no carrinho usa Payment Groups, não splits[] 1:N.
 */

export const ECCOPET_SELLER_ID = "ECCOPET";
export const ECCOPET_SELLER_NAME = "EccoPet";

/** Confirmado pelo código atual: sem splits[] / Orders marketplace 1:N. */
export const MP_SPLIT_MODE = "1:1" as const;
export const MULTI_SELLER_STRATEGY = "PAYMENT_GROUPS" as const;

export const CART_ITEM_TYPES = [
  "PHYSICAL_PRODUCT",
  "SERVICE",
  "HEALTH_SERVICE",
  "AI_PRODUCT",
  "AI_CREDIT",
  "ONE_PLAN",
  "PRO_PLAN",
  "PARTNER_MODULE",
  "CLINICAL_MODULE",
  "DIGITAL_PRODUCT",
] as const;

export type UniversalCartItemType = (typeof CART_ITEM_TYPES)[number];

export const CART_AVAILABILITY = [
  "AVAILABLE",
  "PRICE_CHANGED",
  "OUT_OF_STOCK",
  "SELLER_DISABLED",
  "MP_NOT_CONNECTED",
  "EXPIRED",
  "NOT_AVAILABLE",
] as const;

export type CartAvailability = (typeof CART_AVAILABILITY)[number];

export type CartBillingType = "ONE_TIME" | "SUBSCRIPTION";

export function canonicalCartType(itemType: string, sku?: string | null): UniversalCartItemType {
  if (itemType === "DIGITAL_AI" || itemType === "AI_PRODUCT" || itemType === "AI_CREDIT") {
    return sku === "AI_PET_HEALTH_PROFILE" ? "AI_PRODUCT" : "AI_PRODUCT";
  }
  if (itemType === "QUOTE" || itemType === "SERVICE" || itemType === "HEALTH_SERVICE") return "SERVICE";
  if (itemType === "CATALOG_SKU" || itemType === "ONE_PLAN" || itemType === "PRO_PLAN") {
    if (String(sku ?? "").startsWith("PRO-")) return "PRO_PLAN";
    if (String(sku ?? "").startsWith("ONE-")) return "ONE_PLAN";
    if (String(sku ?? "").startsWith("AI-C")) return "CLINICAL_MODULE";
    if (String(sku ?? "").startsWith("AI-P")) return "PARTNER_MODULE";
    return "DIGITAL_PRODUCT";
  }
  return "PHYSICAL_PRODUCT";
}

export function quantityApplies(type: UniversalCartItemType): boolean {
  return type === "PHYSICAL_PRODUCT" || type === "AI_CREDIT";
}

export function exclusivePlanFamily(sku: string): "ONE" | "PRO" | null {
  if (/^ONE-00[0-4]$/.test(sku)) return "ONE";
  if (/^PRO-00[1-4]$/.test(sku)) return "PRO";
  return null;
}

export function typeLabel(type: UniversalCartItemType): string {
  switch (type) {
    case "PHYSICAL_PRODUCT":
      return "Produto";
    case "SERVICE":
      return "Serviço";
    case "HEALTH_SERVICE":
      return "Serviço de saúde";
    case "AI_PRODUCT":
    case "AI_CREDIT":
      return "EccoPet AI";
    case "ONE_PLAN":
      return "Plano One";
    case "PRO_PLAN":
      return "Plano Pro";
    case "PARTNER_MODULE":
      return "Módulo parceiro";
    case "CLINICAL_MODULE":
      return "Módulo clínico";
    default:
      return "Digital";
  }
}

export type UniversalCartLine = {
  id: string;
  type: UniversalCartItemType;
  itemType: string;
  sku: string | null;
  productId: string | null;
  serviceId?: string | null;
  planId?: string | null;
  sellerId: string;
  sellerType: "ECCOPET" | "PARTNER" | "ONG";
  sellerName: string;
  sellerLogo: string | null;
  title: string;
  subtitle: string | null;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number | null;
  discount: number;
  total: number;
  billingType: CartBillingType;
  entitlementType: string | null;
  petId: string | null;
  petName: string | null;
  availability: CartAvailability;
  availabilityMessage: string | null;
  quantityApplies: boolean;
  detailsHref: string | null;
  payable: boolean;
  stock: number;
  metadata: Record<string, unknown>;
  name: string;
  tag: string | null;
  images: unknown;
  variant: string | null;
  checkoutHref: string;
  quoteId?: string;
};

export type SellerGroup = {
  sellerId: string;
  sellerName: string;
  sellerType: UniversalCartLine["sellerType"];
  items: UniversalCartLine[];
  subtotal: number;
};

export function groupBySeller(items: UniversalCartLine[]): SellerGroup[] {
  const order: string[] = [];
  const map = new Map<string, SellerGroup>();
  for (const item of items) {
    const key = item.sellerId || ECCOPET_SELLER_ID;
    let group = map.get(key);
    if (!group) {
      group = {
        sellerId: key,
        sellerName: item.sellerName || ECCOPET_SELLER_NAME,
        sellerType: item.sellerType,
        items: [],
        subtotal: 0,
      };
      map.set(key, group);
      order.push(key);
    }
    group.items.push(item);
    if (item.payable && item.billingType === "ONE_TIME") {
      group.subtotal += item.total;
    }
  }
  return order.map((id) => map.get(id)!);
}

export type CartSummary = {
  products: number;
  services: number;
  ai: number;
  discounts: number;
  shipping: number | null;
  oneTimeTotal: number;
  recurringMonthly: number;
  hasSubscription: boolean;
  payableCount: number;
  blockedCount: number;
};

export function summarizeCart(items: UniversalCartLine[]): CartSummary {
  let products = 0;
  let services = 0;
  let ai = 0;
  let discounts = 0;
  let oneTimeTotal = 0;
  let recurringMonthly = 0;
  let payableCount = 0;
  let blockedCount = 0;
  for (const item of items) {
    if (item.payable) payableCount += 1;
    else blockedCount += 1;
    discounts += item.discount;
    if (item.billingType === "SUBSCRIPTION") {
      if (item.payable) recurringMonthly += item.unitPrice;
      continue;
    }
    if (!item.payable) continue;
    oneTimeTotal += item.total;
    if (item.type === "PHYSICAL_PRODUCT" || item.type === "DIGITAL_PRODUCT") products += item.total;
    else if (item.type === "SERVICE" || item.type === "HEALTH_SERVICE") services += item.total;
    else ai += item.total;
  }
  return {
    products,
    services,
    ai,
    discounts,
    shipping: null,
    oneTimeTotal,
    recurringMonthly,
    hasSubscription: recurringMonthly > 0,
    payableCount,
    blockedCount,
  };
}

export type PaymentGroupKind = "PRODUCT" | "QUOTE" | "AI" | "CATALOG" | "SUBSCRIPTION";

export type PaymentGroupDraft = {
  sellerId: string;
  sellerName: string;
  sellerType: UniversalCartLine["sellerType"];
  kind: PaymentGroupKind;
  billingType: CartBillingType;
  itemIds: string[];
  grossAmount: number;
};

function paymentChannel(item: UniversalCartLine): PaymentGroupKind {
  if (item.billingType === "SUBSCRIPTION") return "SUBSCRIPTION";
  if (item.itemType === "QUOTE" || item.type === "SERVICE" || item.type === "HEALTH_SERVICE") return "QUOTE";
  if (item.itemType === "DIGITAL_AI" || item.type === "AI_PRODUCT" || item.type === "AI_CREDIT") return "AI";
  if (item.itemType === "CATALOG_SKU" || item.type === "ONE_PLAN" || item.type === "PRO_PLAN") return "CATALOG";
  return "PRODUCT";
}

export function partitionPaymentGroups(items: UniversalCartLine[]): PaymentGroupDraft[] {
  const payable = items.filter((i) => i.payable);
  const groups: PaymentGroupDraft[] = [];
  const order: string[] = [];
  const byKey = new Map<string, UniversalCartLine[]>();

  for (const item of payable) {
    const channel = paymentChannel(item);
    const sellerId = item.sellerId || ECCOPET_SELLER_ID;
    const key =
      channel === "SUBSCRIPTION" || channel === "CATALOG"
        ? `${channel}:${item.id}`
        : `${channel}:${sellerId}`;
    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key)!.push(item);
  }

  for (const key of order) {
    const rows = byKey.get(key)!;
    const first = rows[0]!;
    groups.push({
      sellerId: first.sellerId || ECCOPET_SELLER_ID,
      sellerName: first.sellerName || ECCOPET_SELLER_NAME,
      sellerType: first.sellerType,
      kind: paymentChannel(first),
      billingType: first.billingType,
      itemIds: rows.map((r) => r.id),
      grossAmount: rows.reduce((s, r) => s + (r.billingType === "SUBSCRIPTION" ? r.unitPrice : r.total), 0),
    });
  }
  return groups;
}

export function availabilityMessage(status: CartAvailability): string | null {
  switch (status) {
    case "PRICE_CHANGED":
      return "O preço deste item mudou. O valor atualizado será cobrado.";
    case "OUT_OF_STOCK":
      return "Estoque esgotado. Remova o item para continuar.";
    case "SELLER_DISABLED":
    case "MP_NOT_CONNECTED":
      return "Este vendedor ainda não está habilitado para receber pagamentos.";
    case "EXPIRED":
      return "Este item expirou. Remova-o para continuar.";
    case "NOT_AVAILABLE":
      return "Item indisponível no momento.";
    default:
      return null;
  }
}

export function isPayable(status: CartAvailability): boolean {
  return status === "AVAILABLE" || status === "PRICE_CHANGED";
}

import { sanitizeDataLayerParams } from "./event-sanitizer";

export type GtmEcommerceItem = {
  item_id: string;
  item_name?: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
  affiliation?: string;
  coupon?: string;
  discount?: number;
};

export type GtmEcommercePayload = {
  currency?: string;
  value?: number;
  transaction_id?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items?: GtmEcommerceItem[];
};

/** Normaliza items ecommerce (sem PII). */
export function buildEcommerceParams(
  action: string,
  payload: GtmEcommercePayload
): Record<string, string | number | boolean> {
  const items = (payload.items ?? []).slice(0, 20).map((it, idx) => ({
    item_id: String(it.item_id).slice(0, 64),
    item_name: it.item_name ? String(it.item_name).slice(0, 80) : undefined,
    item_brand: it.item_brand,
    item_category: it.item_category,
    item_category2: it.item_category2,
    item_variant: it.item_variant,
    price: it.price,
    quantity: it.quantity ?? 1,
    index: it.index ?? idx,
    affiliation: it.affiliation,
    coupon: it.coupon,
    discount: it.discount,
  }));

  // Data Layer: itens como contagem + ids (objetos aninhados não passam no sanitize plano)
  const itemIds = items.map((i) => i.item_id).join(",");
  return sanitizeDataLayerParams({
    ecommerce_action: action,
    currency: payload.currency ?? "BRL",
    value: payload.value,
    transaction_id: payload.transaction_id
      ? String(payload.transaction_id).slice(0, 64)
      : undefined,
    tax: payload.tax,
    shipping: payload.shipping,
    coupon: payload.coupon,
    items_count: items.length,
    item_ids: itemIds.slice(0, 200),
  });
}

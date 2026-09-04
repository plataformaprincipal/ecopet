export type QuoteLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  sku?: string | null;
  productId?: string | null;
  serviceId?: string | null;
};

export type QuoteEngineSlice = {
  customerAmountCents: number;
  eccopetCommissionCents: number;
  estimatedTaxProvisionCents: number;
  discountCents: number;
  pricingVersion: string;
  snapshot: unknown;
};

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function validateQuoteLines(items: QuoteLineInput[]): QuoteLineInput[] {
  if (!items.length) throw new Error("QUOTE_EMPTY");
  return items.map((item, idx) => {
    const description = item.description.trim();
    if (!description) throw new Error("QUOTE_ITEM_DESCRIPTION");
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      throw new Error("QUOTE_ITEM_QUANTITY");
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new Error("QUOTE_ITEM_PRICE");
    }
    return {
      description: description.slice(0, 240),
      quantity: item.quantity,
      unitPrice: roundMoney(item.unitPrice),
      sku: item.sku ?? null,
      productId: item.productId ?? null,
      serviceId: item.serviceId ?? null,
      sortHint: idx,
    };
  });
}

export function quoteSubtotal(items: QuoteLineInput[]): number {
  return roundMoney(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
}

/** Desconto do parceiro: nunca negativo e nunca maior que o subtotal. Total do browser é ignorado. */
export function clampPartnerDiscount(subtotal: number, requested: number | undefined): number {
  if (!Number.isFinite(requested) || requested === undefined) return 0;
  return roundMoney(Math.min(Math.max(0, requested), Math.max(0, subtotal)));
}

export function clampShipping(requested: number | undefined): number {
  if (!Number.isFinite(requested) || requested === undefined) return 0;
  return roundMoney(Math.max(0, requested));
}

/** Aplica desconto proporcional nas linhas antes do Pricing Engine. */
export function linesAfterDiscount(items: QuoteLineInput[], discountAmount: number): QuoteLineInput[] {
  const subtotal = quoteSubtotal(items);
  const discount = clampPartnerDiscount(subtotal, discountAmount);
  if (!(subtotal > 0) || discount === 0) return items;
  const factor = (subtotal - discount) / subtotal;
  return items.map((item) => ({
    ...item,
    unitPrice: roundMoney(item.unitPrice * factor),
  }));
}

export function assembleQuoteFinancials(input: {
  items: QuoteLineInput[];
  discountAmount?: number;
  shippingAmount?: number;
  /** Valor enviado pelo frontend — nunca é fonte de verdade. */
  claimedTotal?: number;
  engine: QuoteEngineSlice;
}) {
  const items = validateQuoteLines(input.items);
  const subtotal = quoteSubtotal(items);
  const discountAmount = clampPartnerDiscount(subtotal, input.discountAmount);
  const shippingAmount = clampShipping(input.shippingAmount);
  const engineTotal = roundMoney(input.engine.customerAmountCents / 100);
  const totalAmount = roundMoney(engineTotal + shippingAmount);
  void input.claimedTotal;
  return {
    items,
    subtotalAmount: subtotal,
    discountAmount,
    shippingAmount,
    commissionAmount: roundMoney(input.engine.eccopetCommissionCents / 100),
    taxAmount: roundMoney(input.engine.estimatedTaxProvisionCents / 100),
    totalAmount,
    pricingVersion: input.engine.pricingVersion,
    pricingSnapshot: {
      engine: input.engine.snapshot,
      claimedTotalIgnored: input.claimedTotal ?? null,
      engineCustomerAmount: engineTotal,
    },
  };
}

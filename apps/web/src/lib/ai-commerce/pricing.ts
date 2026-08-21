import "server-only";
import { prisma } from "@/lib/prisma";
import { getCatalogBySku } from "@/lib/pricing/catalog";
import { quotePricing } from "@/lib/pricing";
import { resolveActivePricingVersion } from "@/lib/pricing/service";
import { AI_COMMERCE_PRODUCTS, getProductDefBySku } from "./catalog";
import {
  areAiCommercePricesConfirmed,
  isAiCommerceEnabled,
  type AiCommerceSku,
} from "./flags";
import { AiCommerceError } from "./errors";

export type ResolvedAiPrice = {
  sku: string;
  priceInCents: number;
  currency: "BRL";
  pricingVersion: string;
  priceVersionId: string | null;
  source: string;
  commercialPending: boolean;
  purchasable: boolean;
};

export async function resolveAiProductPrice(sku: string): Promise<ResolvedAiPrice> {
  const def = getProductDefBySku(sku);
  if (!def) throw new AiCommerceError("SKU_UNKNOWN", "Ferramenta de IA não encontrada.", 404);

  const product = await prisma.aIProduct.findUnique({
    where: { sku },
    include: {
      prices: {
        where: { active: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  const catalog = getCatalogBySku(sku);
  const version = await resolveActivePricingVersion({ charging: true }).catch(() => null);
  const dbPrice = product?.prices[0];
  const priceInCents = dbPrice?.priceInCents ?? catalog?.amountCents ?? 0;
  const source = String(dbPrice?.source ?? catalog?.metadata?.priceSource ?? "DOCUMENT");
  const commercialPending =
    source === "ADMIN_DEFAULT_PENDING_COMMERCIAL" && !areAiCommercePricesConfirmed() && !product?.pricesConfirmedAt;
  const purchasable =
    isAiCommerceEnabled() &&
    priceInCents > 0 &&
    product?.status === "ACTIVE" &&
    !commercialPending;

  return {
    sku,
    priceInCents,
    currency: "BRL",
    pricingVersion: version?.version ?? "BR-2026.08-v1",
    priceVersionId: dbPrice?.id ?? null,
    source,
    commercialPending,
    purchasable,
  };
}

export async function quoteAiSku(params: {
  sku: string;
  quantity?: number;
  coupon?: { code: string; discountType: string; discountValue: number } | null;
}): Promise<{
  quote: ReturnType<typeof quotePricing>;
  resolved: ResolvedAiPrice;
}> {
  const resolved = await resolveAiProductPrice(params.sku);
  const catalog = getCatalogBySku(params.sku);
  const version = await resolveActivePricingVersion({ charging: true });
  const item = catalog
    ? {
        ...catalog,
        commercialAvailability: "PURCHASABLE" as const,
        amountCents: resolved.priceInCents,
      }
    : null;
  const quote = quotePricing({
    kind: "AI",
    sku: params.sku,
    baseAmountCents: resolved.priceInCents,
    quantity: params.quantity ?? 1,
    version,
    catalogItem: item,
    coupon: params.coupon ?? null,
    allowZero: false,
  });
  return { quote, resolved };
}

export function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function listPublicCatalog() {
  const rows = await Promise.all(
    AI_COMMERCE_PRODUCTS.map(async (def) => {
      const price = await resolveAiProductPrice(def.sku);
      return { ...def, price };
    })
  );
  return rows;
}

export type { AiCommerceSku };

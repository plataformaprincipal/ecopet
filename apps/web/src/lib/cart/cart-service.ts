import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProductCatalogStatus } from "@prisma/client";
import { AI_COMMERCE_ITEM_TYPE, isAiCommerceEnabled, isAiCommerceSku, isAiMonetizationFree } from "@/lib/ai-commerce/flags";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { resolveAiProductPrice } from "@/lib/ai-commerce/pricing";
import { ensureAiCommerceProducts } from "@/lib/ai-commerce/product-service";
import { firstProductImageUrl } from "@/lib/catalog/images";
import { computeEarnPoints, DEFAULT_LOYALTY_POLICY } from "@/lib/loyalty/rules";
import { listSellablePartnerIdSet } from "@/lib/seller/eligibility";
import { cartSellerIdentity } from "@/lib/seller/platform";
import { CATALOG_ITEM_TYPE, familyOfSku, getCommercialProduct } from "@/lib/commerce-catalog/products";
import { quoteCatalogSku } from "@/lib/commerce-catalog/quote";
import {
  ECCOPET_SELLER_ID,
  ECCOPET_SELLER_NAME,
  MP_SPLIT_MODE,
  MULTI_SELLER_STRATEGY,
  availabilityMessage,
  canonicalCartType,
  exclusivePlanFamily,
  groupBySeller,
  isPayable,
  partitionPaymentGroups,
  quantityApplies,
  summarizeCart,
  type CartAvailability,
  type UniversalCartLine,
} from "@/lib/cart/universal";

export const QUOTE_CART_ITEM_TYPE = "QUOTE";
export const CATALOG_CART_ITEM_TYPE = CATALOG_ITEM_TYPE;

export const CART_SESSION_COOKIE = "ecopet-cart-session";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              role: true,
              accountStatus: true,
              avatar: true,
              partnerProfile: {
                select: { businessName: true, verificationStatus: true, approvedAt: true },
              },
              ongProfile: {
                select: { name: true, ongName: true, verificationStatus: true, approvedAt: true },
              },
            },
          },
        },
      },
    },
  },
} as const;

export function insufficientStockError(maxQuantity: number) {
  return Object.assign(new Error("INSUFFICIENT_STOCK"), { maxQuantity });
}

export function parseInsufficientStock(error: unknown): number | null {
  if (error && typeof error === "object" && "maxQuantity" in error) {
    const max = Number((error as { maxQuantity?: number }).maxQuantity);
    return Number.isFinite(max) ? max : null;
  }
  return null;
}

export async function getOrCreateCart(userId?: string | null, sessionId?: string | null) {
  if (userId) {
    const existing = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId }, include: cartInclude });
  }
  if (sessionId) {
    const existing = await prisma.cart.findUnique({ where: { sessionId }, include: cartInclude });
    if (existing) return existing;
    return prisma.cart.create({ data: { sessionId }, include: cartInclude });
  }
  throw new Error("CART_IDENTITY_REQUIRED");
}

export async function resolveCartIdentity(userId?: string | null) {
  const jar = await cookies();
  const sessionId = jar.get(CART_SESSION_COOKIE)?.value ?? null;
  return { userId: userId ?? null, sessionId };
}

function productLineKey(productId: string) {
  return `product:${productId}`;
}

function aiLineKey(sku: string, petId: string) {
  return `ai:${sku}:${petId}`;
}

export function quoteLineKey(quoteId: string) {
  return `quote:${quoteId}`;
}

function catalogLineKey(sku: string, petId?: string | null) {
  return `catalog:${sku}:${petId ?? "none"}`;
}

export class PlanConflictError extends Error {
  constructor(
    public family: "ONE" | "PRO",
    public existingSku: string,
    public existingItemId: string
  ) {
    super("PLAN_CONFLICT");
    this.name = "PlanConflictError";
  }
}

export async function mergeAnonymousCart(userId: string, sessionId: string) {
  const [userCart, anonCart] = await Promise.all([
    prisma.cart.findUnique({ where: { userId }, include: cartInclude }),
    prisma.cart.findUnique({ where: { sessionId }, include: { items: true } }),
  ]);
  if (!anonCart?.items.length) {
    return userCart ?? getOrCreateCart(userId);
  }

  const cart = userCart ?? (await prisma.cart.create({ data: { userId } }));
  for (const item of anonCart.items) {
    const lineKey =
      item.lineKey ||
      (item.productId
        ? productLineKey(item.productId)
        : item.itemType === CATALOG_CART_ITEM_TYPE
          ? catalogLineKey(item.sku ?? "unknown", item.petId)
          : item.itemType === QUOTE_CART_ITEM_TYPE
            ? quoteLineKey(String((item.metadata as Record<string, unknown> | null)?.quoteId ?? item.id))
            : aiLineKey(item.sku ?? "unknown", item.petId ?? "none"));
    await prisma.cartItem.upsert({
      where: { cartId_lineKey: { cartId: cart.id, lineKey } },
      create: {
        cartId: cart.id,
        productId: item.productId,
        itemType: item.itemType,
        lineKey,
        sku: item.sku,
        petId: item.petId,
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot,
        pricingVersion: item.pricingVersion,
        metadata: item.metadata ?? undefined,
      },
      update: {
        quantity: item.itemType === "product" ? { increment: item.quantity } : 1,
        unitPriceSnapshot: item.unitPriceSnapshot,
        metadata: item.metadata ?? undefined,
      },
    });
  }
  await prisma.cart.delete({ where: { id: anonCart.id } });
  return getOrCreateCart(userId);
}

export async function validateProductForCart(productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
      status: ProductCatalogStatus.ACTIVE,
      approvalStatus: "APPROVED",
      price: { gte: 0 },
    },
    select: { id: true, sellerId: true, stock: true, price: true },
  });
  if (!product) return null;
  return product;
}

function asMeta(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function lineMoney(params: {
  status: CartAvailability;
  unitPrice: number;
  originalPrice: number | null;
  discount: number;
  quantity: number;
}): Pick<UniversalCartLine, "availability" | "availabilityMessage" | "payable" | "total" | "discount" | "originalPrice"> {
  const payable = isPayable(params.status);
  return {
    availability: params.status,
    availabilityMessage: availabilityMessage(params.status),
    payable,
    originalPrice: params.originalPrice,
    discount: params.discount,
    total: payable ? params.unitPrice * params.quantity : 0,
  };
}

export async function serializeCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  const hideAi = isAiMonetizationFree();
  const quoteSellerIds = [
    ...new Set(
      cart.items
        .filter((item) => item.itemType === QUOTE_CART_ITEM_TYPE)
        .map((item) => {
          const meta = asMeta(item.metadata);
          return typeof meta.partnerId === "string" ? meta.partnerId : null;
        })
        .filter((id): id is string => Boolean(id) && id !== ECCOPET_SELLER_ID)
    ),
  ];
  const [sellable, quoteSellers] = await Promise.all([
    listSellablePartnerIdSet(),
    quoteSellerIds.length
      ? prisma.user.findMany({ where: { id: { in: quoteSellerIds } }, select: { id: true, role: true } })
      : Promise.resolve([] as Array<{ id: string; role: string }>),
  ]);
  const quoteSellerRole = new Map(quoteSellers.map((row) => [row.id, row.role]));
  const lines: UniversalCartLine[] = [];

  for (const item of cart.items) {
    if (hideAi && item.itemType === AI_COMMERCE_ITEM_TYPE) continue;
    const meta = asMeta(item.metadata);

    if (item.itemType === QUOTE_CART_ITEM_TYPE) {
      const unitPrice = item.unitPriceSnapshot ?? 0;
      const rawSellerId = typeof meta.partnerId === "string" ? meta.partnerId : ECCOPET_SELLER_ID;
      const identity = cartSellerIdentity({
        sellerId: rawSellerId,
        role: quoteSellerRole.get(rawSellerId) ?? (rawSellerId === ECCOPET_SELLER_ID ? "ADMIN" : null),
      });
      const expired = typeof meta.validUntil === "string" && Date.parse(meta.validUntil) <= Date.now();
      let status: CartAvailability = "AVAILABLE";
      if (expired) status = "EXPIRED";
      else if (identity.sellerType !== "ECCOPET" && !sellable.has(rawSellerId)) status = "MP_NOT_CONNECTED";
      const title = typeof meta.name === "string" ? meta.name : "Orçamento personalizado";
      lines.push({
        id: item.id,
        type: canonicalCartType("SERVICE"),
        itemType: QUOTE_CART_ITEM_TYPE,
        sku: item.sku,
        productId: null,
        serviceId: typeof meta.serviceId === "string" ? meta.serviceId : null,
        planId: null,
        sellerId: identity.sellerId,
        sellerType: identity.sellerType,
        sellerName:
          identity.sellerType === "ECCOPET"
            ? ECCOPET_SELLER_NAME
            : typeof meta.partnerName === "string"
              ? meta.partnerName
              : "Parceiro",
        sellerLogo: null,
        title,
        subtitle: "Serviço",
        image: null,
        quantity: 1,
        unitPrice,
        ...lineMoney({ status, unitPrice, originalPrice: null, discount: 0, quantity: 1 }),
        billingType: "ONE_TIME",
        entitlementType: null,
        petId: item.petId,
        petName: typeof meta.petName === "string" ? meta.petName : null,
        quantityApplies: false,
        detailsHref: null,
        stock: 1,
        metadata: meta,
        name: title,
        tag: "Serviço",
        images: null,
        variant: null,
        checkoutHref: "/checkout",
        quoteId: typeof meta.quoteId === "string" ? meta.quoteId : item.lineKey.replace(/^quote:/, ""),
      });
      continue;
    }

    if (item.itemType === CATALOG_CART_ITEM_TYPE) {
      const sku = item.sku ?? "";
      const family = familyOfSku(sku);
      const recurring = Boolean(meta.recurring) || family === "ONE" || family === "PRO";
      const unitPrice = item.unitPriceSnapshot ?? 0;
      const status: CartAvailability = unitPrice > 0 ? "AVAILABLE" : "NOT_AVAILABLE";
      const title = typeof meta.name === "string" ? meta.name : sku;
      lines.push({
        id: item.id,
        type: canonicalCartType(CATALOG_CART_ITEM_TYPE, sku),
        itemType: CATALOG_CART_ITEM_TYPE,
        sku,
        productId: null,
        planId: sku,
        sellerId: ECCOPET_SELLER_ID,
        sellerType: "ECCOPET",
        sellerName: ECCOPET_SELLER_NAME,
        sellerLogo: null,
        title,
        subtitle: recurring ? "Assinatura" : "Digital",
        image: null,
        quantity: 1,
        unitPrice,
        ...lineMoney({ status, unitPrice, originalPrice: null, discount: 0, quantity: 1 }),
        billingType: recurring ? "SUBSCRIPTION" : "ONE_TIME",
        entitlementType: typeof meta.capabilityId === "string" ? meta.capabilityId : null,
        petId: item.petId,
        petName: typeof meta.petName === "string" ? meta.petName : null,
        quantityApplies: false,
        detailsHref: typeof meta.href === "string" ? meta.href : "/eccopet",
        stock: 1,
        metadata: meta,
        name: title,
        tag: recurring ? "Assinatura" : "Digital",
        images: null,
        variant: null,
        checkoutHref: "/checkout",
      });
      continue;
    }

    if (item.itemType === AI_COMMERCE_ITEM_TYPE || !item.product) {
      const def = item.sku ? getProductDefBySku(item.sku) : null;
      const unitPrice = item.unitPriceSnapshot ?? 0;
      const type = canonicalCartType(AI_COMMERCE_ITEM_TYPE, item.sku);
      const status: CartAvailability = unitPrice > 0 ? "AVAILABLE" : "NOT_AVAILABLE";
      const title = typeof meta.name === "string" ? meta.name : def?.name ?? item.sku ?? "EccoPet AI";
      lines.push({
        id: item.id,
        type,
        itemType: AI_COMMERCE_ITEM_TYPE,
        sku: item.sku,
        productId: null,
        sellerId: ECCOPET_SELLER_ID,
        sellerType: "ECCOPET",
        sellerName: ECCOPET_SELLER_NAME,
        sellerLogo: null,
        title,
        subtitle: typeof meta.petName === "string" ? meta.petName : def?.tag ?? "EccoPet AI",
        image: null,
        quantity: item.quantity,
        unitPrice,
        ...lineMoney({ status, unitPrice, originalPrice: null, discount: 0, quantity: item.quantity }),
        billingType: def?.billingType === "SUBSCRIPTION" ? "SUBSCRIPTION" : "ONE_TIME",
        entitlementType: def?.capabilityId ?? (typeof meta.capabilityId === "string" ? meta.capabilityId : null),
        petId: item.petId,
        petName: typeof meta.petName === "string" ? meta.petName : null,
        quantityApplies: quantityApplies(type) && def?.billingType === "ONE_TIME",
        detailsHref: def?.href ?? "/eccopet",
        stock: 99,
        metadata: meta,
        name: title,
        tag: typeof meta.tag === "string" ? meta.tag : "EccoPet AI",
        images: null,
        variant: null,
        checkoutHref: "/checkout",
      });
      continue;
    }

    const seller = item.product.seller;
    const identity = cartSellerIdentity({ sellerId: item.product.sellerId, role: seller?.role });
    const sellerName =
      identity.sellerType === "ECCOPET"
        ? ECCOPET_SELLER_NAME
        : seller?.partnerProfile?.businessName ||
          seller?.ongProfile?.ongName ||
          seller?.ongProfile?.name ||
          seller?.name ||
          "Parceiro";
    const currentPrice = item.product.price;
    const snapshot = item.unitPriceSnapshot;
    const originalPrice = snapshot != null && snapshot !== currentPrice ? snapshot : null;
    const discount =
      originalPrice != null && originalPrice > currentPrice ? (originalPrice - currentPrice) * item.quantity : 0;
    let status: CartAvailability = "AVAILABLE";
    if (item.product.status !== ProductCatalogStatus.ACTIVE || item.product.approvalStatus !== "APPROVED") {
      status = "NOT_AVAILABLE";
    } else if (item.product.stock < item.quantity) {
      status = "OUT_OF_STOCK";
    } else if (seller?.accountStatus !== "ACTIVE") {
      status = "SELLER_DISABLED";
    } else if (identity.sellerType !== "ECCOPET" && !sellable.has(item.product.sellerId)) {
      status = "MP_NOT_CONNECTED";
    } else if (originalPrice != null) {
      status = "PRICE_CHANGED";
    }
    lines.push({
      id: item.id,
      type: canonicalCartType("product", item.product.pricingCatalogSku),
      itemType: "product",
      sku: item.product.pricingCatalogSku,
      productId: item.productId,
      sellerId: identity.sellerId,
      sellerType: identity.sellerType,
      sellerName,
      sellerLogo: seller?.avatar || null,
      title: item.product.name,
      subtitle: item.product.unit ?? item.product.brand ?? null,
      image: firstProductImageUrl(item.product.images),
      quantity: item.quantity,
      unitPrice: currentPrice,
      ...lineMoney({
        status,
        unitPrice: currentPrice,
        originalPrice,
        discount,
        quantity: item.quantity,
      }),
      billingType: "ONE_TIME",
      entitlementType: null,
      petId: null,
      petName: null,
      quantityApplies: true,
      detailsHref: `/produtos/${item.productId}`,
      stock: item.product.stock,
      metadata: meta,
      name: item.product.name,
      tag: null,
      images: item.product.images,
      variant: item.product.unit ?? item.product.brand ?? null,
      checkoutHref: "/checkout",
    });
  }

  const summary = summarizeCart(lines);
  const groups = groupBySeller(lines);
  const paymentGroups = partitionPaymentGroups(lines);
  const partnerIds = new Set(lines.filter((i) => i.sellerType !== "ECCOPET").map((i) => i.sellerId).filter(Boolean));
  const productItems = lines.filter((i) => i.itemType === "product" || i.itemType === QUOTE_CART_ITEM_TYPE);
  const aiItems = lines.filter((i) => i.itemType === AI_COMMERCE_ITEM_TYPE);
  const estimatedRewards = DEFAULT_LOYALTY_POLICY.enabled
    ? computeEarnPoints({
        amountBrl: summary.products,
        pointsPerBrl: DEFAULT_LOYALTY_POLICY.pointsPerBrl,
      })
    : 0;

  return {
    id: cart.id,
    items: lines,
    groups,
    paymentGroups,
    summary,
    itemCount: lines.reduce((s, i) => s + i.quantity, 0),
    subtotal: summary.oneTimeTotal,
    productSubtotal: summary.products,
    aiSubtotal: summary.ai,
    hasProducts: productItems.length > 0,
    hasAi: aiItems.length > 0,
    mixed: productItems.length > 0 && aiItems.length > 0,
    multiPartner: partnerIds.size > 1,
    partnerId: partnerIds.size === 1 ? [...partnerIds][0] : null,
    estimatedRewards,
    discount: summary.discounts,
    shipping: null as number | null,
    hasSubscription: summary.hasSubscription,
    recurringMonthly: summary.recurringMonthly,
    blockedCount: summary.blockedCount,
    splitMode: MP_SPLIT_MODE,
    multiSellerStrategy: MULTI_SELLER_STRATEGY,
  };
}

export async function resolveCartForRequest() {
  const user = await getCurrentUser();
  const { sessionId } = await resolveCartIdentity(user?.id);
  let effectiveSessionId = sessionId;
  let newSessionId: string | null = null;

  if (!user?.id && !effectiveSessionId) {
    effectiveSessionId = randomUUID();
    newSessionId = effectiveSessionId;
  }

  const cart =
    user?.id && effectiveSessionId
      ? await mergeAnonymousCart(user.id, effectiveSessionId)
      : await getOrCreateCart(user?.id, effectiveSessionId);

  return { cart, newSessionId };
}

export async function addToCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>, productId: string, quantity = 1) {
  const product = await validateProductForCart(productId);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const lineKey = productLineKey(productId);
  const existing = cart.items.find((i) => i.lineKey === lineKey || i.productId === productId);
  const newQty = (existing?.quantity ?? 0) + quantity;
  if (product.stock <= 0 || newQty > product.stock) throw insufficientStockError(Math.max(0, product.stock));

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, unitPriceSnapshot: product.price, lineKey, itemType: "product" },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        unitPriceSnapshot: product.price,
        itemType: "product",
        lineKey,
      },
    });
  }

  return getOrCreateCart(cart.userId, cart.sessionId);
}

export async function addAiToCart(params: {
  cart: Awaited<ReturnType<typeof getOrCreateCart>>;
  sku: string;
  petId: string;
  petName?: string;
  quantity?: number;
}) {
  if (isAiMonetizationFree()) throw new Error("AI_FREE_BETA");
  if (!isAiCommerceEnabled()) throw new Error("AI_COMMERCE_DISABLED");
  if (!isAiCommerceSku(params.sku)) throw new Error("SKU_UNKNOWN");
  await ensureAiCommerceProducts();
  const def = getProductDefBySku(params.sku);
  if (!def) throw new Error("SKU_UNKNOWN");
  const price = await resolveAiProductPrice(params.sku);
  if (!(price.priceInCents > 0)) throw new Error("PRICE_PENDING");

  const requested = params.quantity ?? 1;
  if (requested < 1 || requested > 10) throw new Error("INVALID_QUANTITY");
  const uniqueUse = def.billingType !== "ONE_TIME";
  const quantity = uniqueUse ? 1 : requested;
  const lineKey = aiLineKey(params.sku, params.petId);
  const existing = params.cart.items.find((i) => i.lineKey === lineKey);
  const unitPrice = price.priceInCents / 100;
  const metadata = {
    name: def.name,
    tag: def.tag,
    petName: params.petName ?? null,
    capabilityId: def.capabilityId,
  };

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: uniqueUse ? 1 : Math.min(10, existing.quantity + quantity),
        unitPriceSnapshot: unitPrice,
        pricingVersion: price.pricingVersion,
        metadata,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: params.cart.id,
        productId: null,
        itemType: AI_COMMERCE_ITEM_TYPE,
        lineKey,
        sku: params.sku,
        petId: params.petId,
        quantity,
        unitPriceSnapshot: unitPrice,
        pricingVersion: price.pricingVersion,
        metadata,
      },
    });
  }
  return getOrCreateCart(params.cart.userId, params.cart.sessionId);
}

export async function addCatalogToCart(params: {
  cart: Awaited<ReturnType<typeof getOrCreateCart>>;
  sku: string;
  petId?: string | null;
  petName?: string | null;
  replacePlan?: boolean;
}) {
  const product = getCommercialProduct(params.sku);
  const quoted = await quoteCatalogSku(params.sku);
  if (!quoted.purchasable || !quoted.billingEnabled) throw new Error("NOT_PURCHASABLE");
  const unitPrice = (quoted.quote?.customerAmountCents ?? quoted.amountCents ?? 0) / 100;
  if (!(unitPrice > 0)) throw new Error("PRICE_PENDING");

  const family = exclusivePlanFamily(params.sku);
  if (family) {
    const existingPlan = params.cart.items.find((item) => {
      if (item.itemType !== CATALOG_CART_ITEM_TYPE || !item.sku) return false;
      return exclusivePlanFamily(item.sku) === family && item.sku !== params.sku;
    });
    if (existingPlan) {
      if (!params.replacePlan) {
        throw new PlanConflictError(family, existingPlan.sku ?? params.sku, existingPlan.id);
      }
      await prisma.cartItem.delete({ where: { id: existingPlan.id } });
    }
  }

  const lineKey = catalogLineKey(params.sku, params.petId);
  const metadata = {
    name: quoted.name,
    href: product?.href ?? quoted.href,
    recurring: quoted.recurring,
    family: quoted.family,
    petName: params.petName ?? null,
  };
  const existing = params.cart.items.find((i) => i.lineKey === lineKey || (i.itemType === CATALOG_CART_ITEM_TYPE && i.sku === params.sku));
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: 1,
        unitPriceSnapshot: unitPrice,
        pricingVersion: quoted.pricingVersion,
        metadata,
        petId: params.petId ?? existing.petId,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: params.cart.id,
        productId: null,
        itemType: CATALOG_CART_ITEM_TYPE,
        lineKey,
        sku: params.sku,
        petId: params.petId ?? null,
        quantity: 1,
        unitPriceSnapshot: unitPrice,
        pricingVersion: quoted.pricingVersion,
        metadata,
      },
    });
  }
  return getOrCreateCart(params.cart.userId, params.cart.sessionId);
}

export async function addQuoteToCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>, quoteId: string) {
  const quote = await prisma.customQuote.findUnique({
    where: { id: quoteId },
    include: { provider: { select: { id: true, name: true, partnerProfile: { select: { businessName: true } } } } },
  });
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  if (quote.status !== "ACCEPTED") throw new Error("QUOTE_NOT_ACCEPTED");
  if (quote.validUntil.getTime() <= Date.now()) throw new Error("QUOTE_EXPIRED");
  if (!cart.userId || cart.userId !== quote.requesterId) throw new Error("QUOTE_FORBIDDEN");

  const extras = (quote.includedItems && typeof quote.includedItems === "object" && !Array.isArray(quote.includedItems)
    ? quote.includedItems
    : {}) as Record<string, unknown>;
  const totalAmount = Number(extras.totalAmount ?? quote.value);
  const pricingVersion = typeof extras.pricingVersion === "string" ? extras.pricingVersion : null;
  const petId = typeof extras.petId === "string" ? extras.petId : null;
  const partnerId = quote.providerId;
  const lineKey = quoteLineKey(quote.id);
  const metadata = {
    quoteId: quote.id,
    name: quote.name,
    partnerId,
    partnerName: quote.provider.partnerProfile?.businessName || quote.provider.name,
    validUntil: quote.validUntil.toISOString(),
  };
  const existing = cart.items.find((i) => i.lineKey === lineKey);
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: 1,
        unitPriceSnapshot: totalAmount,
        pricingVersion,
        metadata,
        itemType: QUOTE_CART_ITEM_TYPE,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: null,
        itemType: QUOTE_CART_ITEM_TYPE,
        lineKey,
        sku: null,
        petId,
        quantity: 1,
        unitPriceSnapshot: totalAmount,
        pricingVersion,
        metadata,
      },
    });
  }
  return getOrCreateCart(cart.userId, cart.sessionId);
}

export async function updateCartItem(
  cart: Awaited<ReturnType<typeof getOrCreateCart>>,
  itemId: string,
  quantity: number
) {
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw new Error("ITEM_NOT_FOUND");

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else if (item.itemType === AI_COMMERCE_ITEM_TYPE) {
    const def = item.sku ? getProductDefBySku(item.sku) : null;
    if (def && def.billingType !== "ONE_TIME") {
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: 1 } });
    } else {
      if (quantity > 10) throw new Error("INVALID_QUANTITY");
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }
  } else if (item.itemType === QUOTE_CART_ITEM_TYPE || item.itemType === CATALOG_CART_ITEM_TYPE) {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: 1 } });
  } else {
    if (!item.product) throw new Error("ITEM_NOT_FOUND");
    if (quantity > item.product.stock) throw insufficientStockError(item.product.stock);
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  return getOrCreateCart(cart.userId, cart.sessionId);
}

export async function clearCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getOrCreateCart(cart.userId, cart.sessionId);
}

export function applyCartSessionCookie(response: NextResponse, sessionId: string | null) {
  if (sessionId) {
    response.cookies.set(CART_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

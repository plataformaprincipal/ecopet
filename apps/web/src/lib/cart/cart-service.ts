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
              partnerProfile: { select: { businessName: true } },
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
    const lineKey = item.lineKey || (item.productId ? productLineKey(item.productId) : aiLineKey(item.sku ?? "unknown", item.petId ?? "none"));
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
      update: { quantity: { increment: item.quantity } },
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
      stock: { gt: 0 },
      price: { gte: 0 },
      seller: {
        accountStatus: "ACTIVE",
        role: "PARTNER",
        partnerProfile: {
          verificationStatus: "APPROVED",
          approvedAt: { not: null },
        },
      },
    },
  });
  return product;
}

export function serializeCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  const hideAi = isAiMonetizationFree();
  const items = cart.items
    .map((item) => {
      if (item.itemType === AI_COMMERCE_ITEM_TYPE || !item.product) {
        const meta = (item.metadata as Record<string, unknown> | null) ?? {};
        return {
          id: item.id,
          itemType: AI_COMMERCE_ITEM_TYPE,
          productId: null,
          sku: item.sku,
          petId: item.petId,
          petName: typeof meta.petName === "string" ? meta.petName : null,
          quantity: item.quantity,
          unitPrice: item.unitPriceSnapshot ?? 0,
          name: typeof meta.name === "string" ? meta.name : item.sku,
          tag: typeof meta.tag === "string" ? meta.tag : null,
          images: null,
          image: null as string | null,
          sellerId: null as string | null,
          sellerName: null as string | null,
          variant: null as string | null,
          stock: 99,
          pricingVersion: item.pricingVersion,
          checkoutHref: "/eccopet/checkout",
        };
      }
      const sellerName =
        item.product.seller?.partnerProfile?.businessName || item.product.seller?.name || null;
      return {
        id: item.id,
        itemType: "product" as const,
        productId: item.productId,
        sku: item.product.pricingCatalogSku,
        petId: null,
        petName: null,
        quantity: item.quantity,
        unitPrice: item.product.price,
        name: item.product.name,
        tag: null,
        images: item.product.images,
        image: firstProductImageUrl(item.product.images),
        sellerId: item.product.sellerId,
        sellerName,
        variant: item.product.unit ?? item.product.brand ?? null,
        stock: item.product.stock,
        pricingVersion: item.pricingVersion,
        checkoutHref: "/checkout",
      };
    })
    .filter((item) => !(hideAi && item.itemType === AI_COMMERCE_ITEM_TYPE));
  const productItems = items.filter((i) => i.itemType === "product");
  const aiItems = items.filter((i) => i.itemType === AI_COMMERCE_ITEM_TYPE);
  const partnerIds = new Set(productItems.map((i) => i.sellerId).filter(Boolean));
  const productSubtotal = productItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const estimatedRewards = DEFAULT_LOYALTY_POLICY.enabled
    ? computeEarnPoints({
        amountBrl: productSubtotal,
        pointsPerBrl: DEFAULT_LOYALTY_POLICY.pointsPerBrl,
      })
    : 0;
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    productSubtotal,
    aiSubtotal: aiItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    hasProducts: productItems.length > 0,
    hasAi: aiItems.length > 0,
    mixed: productItems.length > 0 && aiItems.length > 0,
    multiPartner: partnerIds.size > 1,
    partnerId: partnerIds.size === 1 ? [...partnerIds][0] : null,
    estimatedRewards,
    discount: 0,
    shipping: null as number | null,
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

  const existingSellers = new Set(
    cart.items.filter((i) => i.product).map((i) => i.product!.sellerId)
  );
  if (existingSellers.size > 0 && !existingSellers.has(product.sellerId)) {
    throw new Error("MULTI_PARTNER_CART");
  }

  const lineKey = productLineKey(productId);
  const existing = cart.items.find((i) => i.lineKey === lineKey || i.productId === productId);
  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > product.stock) throw insufficientStockError(product.stock);

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

  const quantity = params.quantity ?? 1;
  if (quantity < 1 || quantity > 10) throw new Error("INVALID_QUANTITY");
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
        quantity: existing.quantity + quantity,
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
    if (quantity > 10) throw new Error("INVALID_QUANTITY");
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
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

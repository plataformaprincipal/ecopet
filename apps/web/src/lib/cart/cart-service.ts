import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProductCatalogStatus } from "@prisma/client";

export const CART_SESSION_COOKIE = "ecopet-cart-session";

export async function getOrCreateCart(userId?: string | null, sessionId?: string | null) {
  if (userId) {
    const existing = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId }, include: { items: { include: { product: true } } } });
  }
  if (sessionId) {
    const existing = await prisma.cart.findUnique({ where: { sessionId }, include: { items: { include: { product: true } } } });
    if (existing) return existing;
    return prisma.cart.create({ data: { sessionId }, include: { items: { include: { product: true } } } });
  }
  throw new Error("CART_IDENTITY_REQUIRED");
}

export async function resolveCartIdentity(userId?: string | null) {
  const jar = await cookies();
  const sessionId = jar.get(CART_SESSION_COOKIE)?.value ?? null;
  return { userId: userId ?? null, sessionId };
}

export async function mergeAnonymousCart(userId: string, sessionId: string) {
  const [userCart, anonCart] = await Promise.all([
    prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } }),
    prisma.cart.findUnique({ where: { sessionId }, include: { items: true } }),
  ]);
  if (!anonCart?.items.length) {
    return userCart ?? getOrCreateCart(userId);
  }

  const cart = userCart ?? (await prisma.cart.create({ data: { userId } }));
  for (const item of anonCart.items) {
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      create: { cartId: cart.id, productId: item.productId, quantity: item.quantity, unitPriceSnapshot: item.unitPriceSnapshot },
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
      seller: { accountStatus: "ACTIVE", role: "PARTNER" },
    },
  });
  return product;
}

export function serializeCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.product.price,
    name: item.product.name,
    images: item.product.images,
    sellerId: item.product.sellerId,
    stock: item.product.stock,
  }));
  const partnerIds = new Set(items.map((i) => i.sellerId));
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    multiPartner: partnerIds.size > 1,
    partnerId: partnerIds.size === 1 ? [...partnerIds][0] : null,
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

  let cart =
    user?.id && effectiveSessionId
      ? await mergeAnonymousCart(user.id, effectiveSessionId)
      : await getOrCreateCart(user?.id, effectiveSessionId);

  return { cart, newSessionId };
}

export async function addToCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>, productId: string, quantity = 1) {
  const product = await validateProductForCart(productId);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const existingSellers = new Set(cart.items.map((i) => i.product.sellerId));
  if (existingSellers.size > 0 && !existingSellers.has(product.sellerId)) {
    throw new Error("MULTI_PARTNER_CART");
  }

  const existing = cart.items.find((i) => i.productId === productId);
  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > product.stock) throw new Error("INSUFFICIENT_STOCK");

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, unitPriceSnapshot: product.price },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, unitPriceSnapshot: product.price },
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
  } else {
    if (quantity > item.product.stock) throw new Error("INSUFFICIENT_STOCK");
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
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

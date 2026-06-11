import { prisma } from "@ecopet/database";
import { serializeProduct } from "../lib/serialize.js";

export async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { seller: { select: { id: true, name: true, isVerified: true } }, category: true },
          },
        },
      },
    },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { seller: { select: { id: true, name: true, isVerified: true } }, category: true },
            },
          },
        },
      },
    });
  }
  return cart;
}

export async function addToCart(userId: string, productId: string, quantity = 1) {
  const product = await prisma.product.findFirst({
    where: { id: productId, approvalStatus: "APPROVED", stock: { gt: 0 } },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  }
  return getOrCreateCart(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw new Error("ITEM_NOT_FOUND");
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  return getOrCreateCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getOrCreateCart(userId);
}

export function serializeCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      product: serializeProduct(item.product),
    })),
  };
}

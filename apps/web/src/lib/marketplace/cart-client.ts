import { marketplaceFetch } from "@/lib/marketplace/fetch-api";
import type { UniversalCartLine, SellerGroup, PaymentGroupDraft, CartSummary } from "@/lib/cart/universal";

const CART_UPDATED = "ecopet:cart-updated";

export type ServerCartItem = UniversalCartLine;

export type ServerCart = {
  id: string;
  items: ServerCartItem[];
  groups?: SellerGroup[];
  paymentGroups?: PaymentGroupDraft[];
  summary?: CartSummary;
  itemCount: number;
  subtotal: number;
  productSubtotal?: number;
  aiSubtotal?: number;
  estimatedRewards?: number;
  discount?: number;
  shipping?: number | null;
  multiPartner: boolean;
  hasProducts?: boolean;
  hasAi?: boolean;
  hasSubscription?: boolean;
  recurringMonthly?: number;
  blockedCount?: number;
  splitMode?: "1:1" | "1:N";
  multiSellerStrategy?: "PAYMENT_GROUPS" | "SINGLE_ORDER_1N";
};

export function emitCartUpdated(cart: ServerCart) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED, { detail: cart }));
}

export function onCartUpdated(handler: (cart: ServerCart) => void) {
  if (typeof window === "undefined") return () => undefined;
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ServerCart>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(CART_UPDATED, listener);
  return () => window.removeEventListener(CART_UPDATED, listener);
}

async function withCart(promise: Promise<ServerCart>): Promise<ServerCart> {
  const cart = await promise;
  emitCartUpdated(cart);
  return cart;
}

export async function fetchServerCart(): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>("/api/cart");
  emitCartUpdated(data.cart);
  return data.cart;
}

export async function addProductToServerCart(productId: string, quantity = 1): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  return withCart(Promise.resolve(data.cart));
}

export async function addSkuToServerCart(params: {
  sku: string;
  petId?: string;
  quantity?: number;
  replacePlan?: boolean;
}): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return withCart(Promise.resolve(data.cart));
}

export async function updateServerCartItem(itemId: string, quantity: number): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  return withCart(Promise.resolve(data.cart));
}

export async function removeServerCartItem(itemId: string): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
  return withCart(Promise.resolve(data.cart));
}

export async function clearServerCart(): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>("/api/cart", {
    method: "DELETE",
  });
  return withCart(Promise.resolve(data.cart));
}

export async function toggleServerFavorite(params: {
  productId?: string;
  serviceId?: string;
  partnerId?: string;
}): Promise<{ favorited: boolean }> {
  return marketplaceFetch("/api/favorites", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function fetchServerFavorites() {
  return marketplaceFetch<{
    productIds: string[];
    serviceIds: string[];
    partnerIds: string[];
  }>("/api/favorites");
}

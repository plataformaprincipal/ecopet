import { marketplaceFetch } from "@/lib/marketplace/fetch-api";

export type ServerCartItem = {
  id: string;
  itemType?: "product" | "DIGITAL_AI" | string;
  productId: string | null;
  quantity: number;
  unitPrice: number;
  name: string;
  images: unknown;
  image?: string | null;
  sellerId: string | null;
  sellerName?: string | null;
  variant?: string | null;
  stock: number;
  sku?: string | null;
  petName?: string | null;
  checkoutHref?: string;
};

export type ServerCart = {
  id: string;
  items: ServerCartItem[];
  itemCount: number;
  subtotal: number;
  productSubtotal?: number;
  estimatedRewards?: number;
  discount?: number;
  shipping?: number | null;
  multiPartner: boolean;
  hasProducts?: boolean;
  hasAi?: boolean;
};

export async function fetchServerCart(): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>("/api/cart");
  return data.cart;
}

export async function addProductToServerCart(productId: string, quantity = 1): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  return data.cart;
}

export async function updateServerCartItem(itemId: string, quantity: number): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  return data.cart;
}

export async function removeServerCartItem(itemId: string): Promise<ServerCart> {
  const data = await marketplaceFetch<{ cart: ServerCart }>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
  return data.cart;
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

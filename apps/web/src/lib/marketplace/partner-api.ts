/**
 * Cliente parceiro — Fase 2: Route Handlers Next.js (/api/partner/*).
 * Express /api/marketplace/partner/* está com mutações desativadas (410).
 */
import type { Order } from "@/lib/orders/api";

async function nextJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.error?.message || body?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return (body?.data ?? body) as T;
}

export async function fetchPartnerOrders(_token?: string) {
  const data = await nextJson<{
    orders: (Order & { user?: { id: string; name: string; email: string } })[];
  }>("/api/partner/orders");
  return data.orders ?? [];
}

export async function updatePartnerOrderStatus(
  _token: string | undefined,
  orderId: string,
  status: string,
  note?: string
) {
  return nextJson(`/api/partner/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export async function createPartnerProduct(
  _token: string | undefined,
  data: {
    name: string;
    description: string;
    price: number;
    stock?: number;
    categoryId?: string;
    catalogCategory?: string;
  }
) {
  return nextJson("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock ?? 0,
      catalogCategory: data.catalogCategory ?? "OTHER",
    }),
  });
}

export async function createPartnerService(
  _token: string | undefined,
  data: {
    name: string;
    description: string;
    price: number;
    category: string;
    durationMin?: number;
  }
) {
  return nextJson("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      durationMin: data.durationMin,
    }),
  });
}

import { api } from "@/lib/api";
import type { Order } from "@/lib/orders/api";

export async function fetchPartnerOrders(token: string) {
  return api<(Order & { user?: { id: string; name: string; email: string } })[]>("/api/marketplace/partner/orders", { token });
}

export async function updatePartnerOrderStatus(token: string, orderId: string, status: string, note?: string) {
  return api(`/api/marketplace/partner/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status, note }),
  });
}

export async function createPartnerProduct(
  token: string,
  data: { name: string; description: string; price: number; stock?: number; categoryId?: string }
) {
  return api("/api/marketplace/partner/products", { method: "POST", token, body: JSON.stringify(data) });
}

export async function createPartnerService(
  token: string,
  data: { name: string; description: string; price: number; category: string; durationMin?: number }
) {
  return api("/api/marketplace/partner/services", { method: "POST", token, body: JSON.stringify(data) });
}

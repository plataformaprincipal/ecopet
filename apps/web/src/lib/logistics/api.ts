import { api } from "@/lib/api";
import type { DeliveryMethod } from "@/lib/orders/api";

export interface LogisticsMethod {
  method: DeliveryMethod;
  label: string;
  days: number;
  fee: number;
}

export interface LogisticsConfig {
  pickupAddress: Record<string, string>;
  pickupHours: string | null;
  pickupInstructions: string | null;
  pickupResponsible: string | null;
  mapLat: number | null;
  mapLng: number | null;
}

export async function fetchPartnerLogistics(partnerId: string) {
  return api<{ config: LogisticsConfig; methods: LogisticsMethod[] }>(
    `/api/logistics/partner/${partnerId}`
  );
}

export async function calculateShipping(partnerId: string, method: DeliveryMethod) {
  return api<{
    method: DeliveryMethod;
    label: string;
    fee: number;
    days: number;
    estimatedDelivery: string;
    pickup: LogisticsConfig;
    carrier: string | null;
  }>("/api/logistics/calculate", {
    method: "POST",
    body: JSON.stringify({ partnerId, method }),
  });
}

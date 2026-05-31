import { prisma } from "@ecopet/database";
import type { DeliveryMethod } from "@prisma/client";

const PARTNER_ROLES = ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER"] as const;

const MOCK_PARTNER_MAP: Record<string, string> = {
  mp1: "loja@ecopet.com.br",
  mp2: "vet@ecopet.com.br",
};

export async function resolvePartnerId(partnerId: string) {
  const email = MOCK_PARTNER_MAP[partnerId];
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) return user.id;
  }
  return partnerId;
}

export async function getOrCreatePartnerLogistics(partnerId: string) {
  const resolvedId = await resolvePartnerId(partnerId);
  let config = await prisma.partnerLogisticsConfig.findUnique({ where: { partnerId: resolvedId } });
  if (!config) {
    const partner = await prisma.user.findUnique({
      where: { id: resolvedId },
      include: { address: true, petshopProfile: true },
    });
    if (!partner || !PARTNER_ROLES.includes(partner.role as typeof PARTNER_ROLES[number])) {
      throw new Error("Parceiro inválido");
    }
    const addr = partner.address;
    config = await prisma.partnerLogisticsConfig.create({
      data: {
        partnerId: resolvedId,
        pickupAddress: addr
          ? { street: addr.street, number: addr.number, city: addr.city, state: addr.state, zipCode: addr.zipCode }
          : { street: "Endereço do parceiro", city: "São Paulo", state: "SP" },
        pickupHours: "Seg-Sex 9h-18h, Sáb 9h-13h",
        pickupInstructions: "Apresente documento e número do pedido na recepção.",
        pickupResponsible: partner.name,
        deliveryLocal: partner.petshopProfile?.delivery ?? true,
        pickupEnabled: partner.petshopProfile?.pickup ?? true,
      },
    });
  }
  return config;
}

export function getAvailableDeliveryMethods(config: Awaited<ReturnType<typeof getOrCreatePartnerLogistics>>) {
  const methods: { method: DeliveryMethod; label: string; days: number; fee: number }[] = [];
  if (config.pickupEnabled) {
    methods.push({ method: "PICKUP_LOCAL", label: "Retirar no local", days: 0, fee: 0 });
  }
  if (config.scheduledPickup) {
    methods.push({ method: "PICKUP_SCHEDULED", label: "Agendar retirada", days: 0, fee: 0 });
  }
  if (config.deliveryLocal) {
    methods.push({ method: "DELIVERY_LOCAL", label: "Entrega local", days: config.localDeliveryDays, fee: config.localDeliveryFee });
  }
  if (config.deliveryRegional) {
    methods.push({ method: "DELIVERY_REGIONAL", label: "Entrega regional", days: config.regionalDeliveryDays, fee: config.regionalDeliveryFee });
  }
  if (config.deliveryNational) {
    methods.push({ method: "DELIVERY_NATIONAL", label: "Entrega nacional", days: config.nationalDeliveryDays, fee: config.nationalDeliveryFee });
  }
  if (config.deliveryOwn) {
    methods.push({ method: "DELIVERY_OWN", label: "Entrega própria do parceiro", days: config.localDeliveryDays, fee: config.localDeliveryFee });
  }
  if (config.deliveryPartnerLogistics) {
    methods.push({ method: "DELIVERY_PARTNER_LOGISTICS", label: "Entrega por parceiro logístico", days: config.regionalDeliveryDays, fee: config.regionalDeliveryFee });
  }
  if (config.scheduledDelivery) {
    methods.push({ method: "DELIVERY_SCHEDULED", label: "Agendar entrega", days: config.localDeliveryDays, fee: config.localDeliveryFee });
  }
  return methods;
}

export async function calculateShipping(partnerId: string, method: DeliveryMethod) {
  const resolvedId = await resolvePartnerId(partnerId);
  const config = await getOrCreatePartnerLogistics(resolvedId);
  const options = getAvailableDeliveryMethods(config);
  const option = options.find((o) => o.method === method);
  if (!option) throw new Error("Método de entrega não disponível para este parceiro");

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + option.days);

  return {
    method: option.method,
    label: option.label,
    fee: option.fee,
    days: option.days,
    estimatedDelivery,
    pickup: {
      address: config.pickupAddress,
      hours: config.pickupHours,
      instructions: config.pickupInstructions,
      responsible: config.pickupResponsible,
      mapLat: config.mapLat,
      mapLng: config.mapLng,
    },
    carrier: method === "DELIVERY_PARTNER_LOGISTICS" ? (config.carrierPartners as string[] | null)?.[0] ?? "Logística ECOPET" : null,
  };
}

export function generatePickupQrCode(orderId: string, orderNumber: number) {
  const payload = JSON.stringify({ orderId, orderNumber, ts: Date.now() });
  return `ECOPET-PICKUP-${Buffer.from(payload).toString("base64url")}`;
}

export async function updatePartnerLogistics(partnerId: string, data: Record<string, unknown>) {
  await getOrCreatePartnerLogistics(partnerId);
  return prisma.partnerLogisticsConfig.update({
    where: { partnerId },
    data: data as Parameters<typeof prisma.partnerLogisticsConfig.update>[0]["data"],
  });
}

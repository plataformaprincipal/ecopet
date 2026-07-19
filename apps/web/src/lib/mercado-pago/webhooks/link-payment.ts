import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function findPaymentByMpIds(params: {
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  externalReference?: string | null;
  merchantOrderId?: string | null;
}) {
  const or: Array<Record<string, unknown>> = [];
  if (params.providerOrderId) {
    or.push({ providerOrderId: params.providerOrderId }, { externalId: params.providerOrderId });
  }
  if (params.providerPaymentId) {
    or.push({ providerPaymentId: params.providerPaymentId });
  }
  if (params.externalReference) {
    or.push({ externalReference: params.externalReference });
    if (params.externalReference.startsWith("ecopet_")) {
      or.push({ orderId: params.externalReference.replace(/^ecopet_/, "") });
    }
  }

  if (!or.length) return null;

  return prisma.payment.findFirst({
    where: { provider: "mercado_pago", OR: or },
    include: {
      order: {
        select: {
          id: true,
          userId: true,
          partnerId: true,
          orderNumber: true,
          status: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function sanitizeResourceBody(body: Record<string, unknown>): Record<string, unknown> {
  const clone = { ...body };
  for (const key of Object.keys(clone)) {
    const lk = key.toLowerCase();
    if (
      lk.includes("token") ||
      lk.includes("secret") ||
      lk.includes("password") ||
      lk === "card_number" ||
      lk === "security_code" ||
      lk === "cvv"
    ) {
      delete clone[key];
    }
  }
  // Truncar campos grandes
  const json = JSON.stringify(clone);
  if (json.length > 12_000) {
    return { truncated: true, keys: Object.keys(clone).slice(0, 40) };
  }
  return clone;
}

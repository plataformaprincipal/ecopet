import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const AI_AUDIT = {
  PRODUCT_PURCHASED: "AI_PRODUCT_PURCHASED",
  ENTITLEMENT_CREATED: "AI_ENTITLEMENT_CREATED",
  EXECUTION_STARTED: "AI_EXECUTION_STARTED",
  EXECUTION_COMPLETED: "AI_EXECUTION_COMPLETED",
  EXECUTION_FAILED: "AI_EXECUTION_FAILED",
  REPORT_GENERATED: "AI_REPORT_GENERATED",
  ENTITLEMENT_CONSUMED: "AI_ENTITLEMENT_CONSUMED",
  ENTITLEMENT_REVOKED: "AI_ENTITLEMENT_REVOKED",
  PAYMENT_REFUNDED: "AI_PAYMENT_REFUNDED",
} as const;

export async function writeAiCommerceAudit(params: {
  userId?: string | null;
  action: string;
  sku?: string | null;
  orderId?: string | null;
  paymentId?: string | null;
  executionId?: string | null;
  entitlementId?: string | null;
  metadata?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
}) {
  const db = params.tx ?? prisma;
  try {
    await db.aICommerceAuditEvent.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        sku: params.sku ?? null,
        orderId: params.orderId ?? null,
        paymentId: params.paymentId ?? null,
        executionId: params.executionId ?? null,
        entitlementId: params.entitlementId ?? null,
        metadata: params.metadata,
      },
    });
  } catch {
    /* auditoria não bloqueia o fluxo comercial */
  }
}

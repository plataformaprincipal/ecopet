import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;
  const alerts = await prisma.mpFraudAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: { select: { id: true, orderNumber: true, total: true, userId: true, partnerId: true } },
    },
  });
  return apiSuccess({ alerts });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;
  const body = (await request.json()) as { id?: string; status?: string; notes?: string };
  if (!body.id || !body.status) {
    return apiFailure("VALIDATION", "id e status obrigatórios.", 400);
  }
  const allowed = ["PENDING_REVIEW", "APPROVED", "REJECTED", "BLOCKED", "RELEASED", "REFUNDED"];
  if (!allowed.includes(body.status)) {
    return apiFailure("VALIDATION", "Status inválido.", 400);
  }

  const alert = await prisma.mpFraudAlert.update({
    where: { id: body.id },
    data: {
      status: body.status as never,
      adminNotes: body.notes?.slice(0, 500),
      resolvedAt: ["RELEASED", "APPROVED", "REFUNDED", "REJECTED"].includes(body.status)
        ? new Date()
        : undefined,
      resolvedById: user!.id,
    },
  });

  if (alert.orderId && body.status === "RELEASED") {
    await prisma.order.update({
      where: { id: alert.orderId },
      data: { fraudHold: false, fulfillmentBlocked: false },
    });
  }

  await writeAuditLog({
    actorId: user!.id,
    action: "UPDATE",
    module: "admin.mercado_pago.fraud",
    resource: "MpFraudAlert",
    resourceId: alert.id,
    observation: `status=${body.status}`,
  });

  return apiSuccess({ alert });
}

import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { COMMERCE_REPORT_REASONS, COMMERCE_REPORT_TARGETS } from "@/lib/commerce/ops-policy";
import { writeAuditLog } from "@/lib/audit-log";
import { createInternalNotification } from "@/lib/notifications/internal";

export const dynamic = "force-dynamic";

const schema = z.object({
  targetType: z.enum(COMMERCE_REPORT_TARGETS),
  targetId: z.string().min(1).max(64),
  reason: z.enum(COMMERCE_REPORT_REASONS),
  description: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos.", 400);

  const duplicate = await prisma.contentReport.findFirst({
    where: {
      reporterId: user!.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      status: { in: ["PENDING", "REVIEWING"] },
    },
  });
  if (duplicate) return apiSuccess({ report: duplicate, protocol: duplicate.id });

  const report = await prisma.contentReport.create({
    data: {
      reporterId: user!.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      description: parsed.data.description ?? null,
      status: "PENDING",
    },
  });

  if (parsed.data.targetType === "review") {
    await prisma.review.updateMany({
      where: { id: parsed.data.targetId },
      data: { reportCount: { increment: 1 }, moderationStatus: "REPORTED" },
    });
    await prisma.serviceReview.updateMany({
      where: { id: parsed.data.targetId },
      data: { reportCount: { increment: 1 }, moderationStatus: "REPORTED" },
    });
  }

  await writeAuditLog({
    actorId: user!.id,
    action: "CREATE",
    module: "commerce.report",
    resource: "ContentReport",
    resourceId: report.id,
    metadata: parsed.data,
  }).catch(() => undefined);

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "GESTOR"] }, accountStatus: "ACTIVE" },
    select: { id: true },
    take: 8,
  });
  await Promise.all(
    admins.map((admin) =>
      createInternalNotification({
        userId: admin.id,
        title: "Nova denúncia comercial",
        body: `${parsed.data.targetType} · ${parsed.data.reason}`,
        type: "CONTENT_REPORT",
        actionUrl: "/dashboard/admin/support",
        data: { reportId: report.id },
      }).catch(() => undefined)
    )
  );

  return apiSuccess({ report, protocol: report.id }, 201);
}

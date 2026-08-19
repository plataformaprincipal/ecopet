import { UserRole } from "@prisma/client";
import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { adjustLoyaltyPoints, LoyaltyError } from "@/lib/loyalty/service";
import { writeAuditLog } from "@/lib/audit-log";

const bodySchema = z.object({
  userId: z.string().min(1),
  points: z.number().int(),
  reason: z.string().trim().min(8).max(500),
  requestId: z.string().min(8).max(80),
});

export async function POST(request: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos.", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!target) return apiFailure("NOT_FOUND", "Usuário não encontrado.", 404);

  try {
    const result = await adjustLoyaltyPoints({
      userId: parsed.data.userId,
      points: parsed.data.points,
      reason: parsed.data.reason,
      adminId: user!.id,
      requestId: parsed.data.requestId,
    });
    await writeAuditLog({
      actorId: user!.id,
      action: "UPDATE",
      module: "loyalty",
      resource: "LoyaltyAccount",
      resourceId: result.account.id,
      observation: `ADJUSTMENT ${parsed.data.points}: ${parsed.data.reason}`,
    }).catch(() => undefined);
    return apiSuccess({
      duplicated: result.duplicated,
      pointsBalance: result.account.pointsBalance,
    });
  } catch (e) {
    if (e instanceof LoyaltyError) {
      return apiFailure(e.code, e.message, e.status);
    }
    console.error("[loyalty:admin-adjust]", e);
    return apiFailure("INTERNAL", "Não foi possível ajustar os pontos.", 500);
  }
}

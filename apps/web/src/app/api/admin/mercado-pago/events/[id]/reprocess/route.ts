import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { writeAuditLog } from "@/lib/audit-log";
import { reprocessMpWebhookEvent } from "@/lib/mercado-pago/webhooks/pipeline";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: Ctx) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;
  if (!checkRateLimit(`mp-reprocess:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite excedido.", 429);
  }

  const { id } = await context.params;
  try {
    const result = await reprocessMpWebhookEvent(id);
    await writeAuditLog({
      actorId: user!.id,
      action: "SYNC",
      module: "admin.mercado_pago",
      resource: "MpWebhookEvent",
      resourceId: id,
      observation: `Reprocessamento manual → ${result.processingStatus}`,
    });
    return apiSuccess({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    if (msg === "NOT_FOUND") return apiFailure("NOT_FOUND", "Evento não encontrado.", 404);
    return apiFailure("INTERNAL", "Falha ao reprocessar.", 500);
  }
}

import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { claimTransactionalEvent, isTransactionalEventName } from "@/lib/server/gtm";

export const dynamic = "force-dynamic";

/**
 * POST /api/telemetry/transactional-claim
 * Claim server-side para purchase/refund/etc. — usuário autenticado.
 * Não é admin-only: checkout precisa claimar antes do Data Layer.
 */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`telemetry-claim:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de claims.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiFailure("VALIDATION", "JSON inválido.", 400);
  }

  const raw = body as {
    eventName?: unknown;
    entityType?: unknown;
    entityId?: unknown;
  };
  const eventName = typeof raw.eventName === "string" ? raw.eventName : "";
  const entityType = typeof raw.entityType === "string" ? raw.entityType.slice(0, 40) : "";
  const entityId = typeof raw.entityId === "string" ? raw.entityId.slice(0, 128) : "";

  if (!isTransactionalEventName(eventName)) {
    return apiFailure("VALIDATION", "Evento não elegível para deduplicação.", 400);
  }
  if (!entityType || !entityId) {
    return apiFailure("VALIDATION", "entityType e entityId obrigatórios.", 400);
  }

  try {
    const result = await claimTransactionalEvent({
      eventName,
      entityType,
      entityId,
    });
    return apiSuccess({
      claimed: result.claimed,
      attempts: result.attempts,
      /** Chave hasheada — não é o entityId. */
      keyPreview: `${result.key.slice(0, 8)}…`,
    });
  } catch (e) {
    return apiFailure(
      "INTERNAL",
      e instanceof Error ? e.message : "Falha no claim.",
      500
    );
  }
}

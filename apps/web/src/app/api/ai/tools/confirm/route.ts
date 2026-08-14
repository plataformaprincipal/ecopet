import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { normalizeLocale } from "@/lib/ai/ai-config";
import { enforceOperationalAiLimits } from "@/lib/ai/ai-rate-limit";
import { isAiFlagEnabled } from "@/lib/ai/operational";
import { executeBusinessTool, personaForRole } from "@/lib/ai/modules";
import {
  deriveIdempotencyKey,
  findPriorConfirmedWrite,
  recordConfirmedWrite,
} from "@/lib/ai/tool-idempotency";

export const dynamic = "force-dynamic";

/** Ferramentas do executor de negócio que exigem confirmação explícita. */
const CONFIRMABLE_TOOLS = ["add_to_cart", "create_support_ticket", "prepare_appointment"] as const;

const schema = z.object({
  tool: z.enum(CONFIRMABLE_TOOLS),
  params: z.record(z.unknown()).default({}),
  locale: z.string().max(16).optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

/**
 * Executa uma mutação que a IA apenas pré-visualizou.
 * A confirmação vem do clique do usuário — nunca do modelo.
 */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!isAiFlagEnabled("tools")) {
    return apiFailure("AI_FLAG_DISABLED", "Ferramentas IA desativadas.", 503);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const idempotencyKey = deriveIdempotencyKey(
    user.id,
    parsed.data.tool,
    parsed.data.params,
    parsed.data.idempotencyKey
  );

  const prior = await findPriorConfirmedWrite({
    userId: user.id,
    toolName: parsed.data.tool,
    idempotencyKey,
  });
  if (prior.duplicate) {
    return apiSuccess({ ok: true, duplicate: true, data: prior.result });
  }

  try {
    enforceOperationalAiLimits(user.id);
    const started = Date.now();
    const result = await executeBusinessTool(
      parsed.data.tool,
      {
        userId: user.id,
        role: user.role,
        persona: personaForRole(user.role),
        locale: normalizeLocale(parsed.data.locale),
        confirmed: true,
      },
      parsed.data.params
    );

    if (!result.ok) {
      return apiFailure("AI_ACTION_ERROR", result.error ?? "Não foi possível concluir a ação.", 400);
    }

    if (result.executed) {
      await recordConfirmedWrite({
        userId: user.id,
        toolName: parsed.data.tool,
        idempotencyKey,
        result: result.data,
        latencyMs: Date.now() - started,
      });
    }

    return apiSuccess({ ...result, idempotencyKey });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ação indisponível";
    return apiFailure("AI_ACTION_ERROR", msg, 503);
  }
}

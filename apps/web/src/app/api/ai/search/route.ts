import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { semanticSearch } from "@/lib/ai/ai-embeddings";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { enforceAiLimits } from "@/lib/ai/ai-rate-limit";
import { AiRuntimeError } from "@/lib/ai/ai-errors";

const schema = z.object({
  query: z.string().min(1).max(500),
  locale: z.string().optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  try {
    await enforceAiLimits(user.id);
    const results = await semanticSearch(parsed.data.query, {
      locale: parsed.data.locale,
      limit: parsed.data.limit ?? 8,
    });
    // Apenas documentos públicos de conhecimento — sem conteúdo privado
    const publicResults = results.filter((r) =>
      ["faq", "help", "policy", "terms", "manual", "product", "service", "partner", "ong", "post"].includes(
        r.sourceType
      )
    );
    await writeAiAuditLog({
      userId: user.id,
      role: user.role,
      module: "search",
      action: "semantic-search",
      decision: "ALLOW",
      metadata: { hits: publicResults.length },
    });
    return apiSuccess({ results: publicResults });
  } catch (e) {
    const msg = e instanceof AiRuntimeError ? e.message : "Busca indisponível.";
    const code = e instanceof AiRuntimeError ? e.code : "AI_UNAVAILABLE";
    return apiFailure(code, msg, e instanceof AiRuntimeError ? e.status : 503);
  }
}

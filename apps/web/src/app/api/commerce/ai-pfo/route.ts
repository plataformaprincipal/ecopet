import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";
import { AiCommerceError } from "@/lib/ai-commerce/errors";
import { runPfoAiModule } from "@/lib/ai-pfo/run";
import { PFO_AI_MODULES } from "@/lib/ai-pfo/modules";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sku: z.string().regex(/^AI-[TPC]\d{2}$/),
  input: z.record(z.string(), z.unknown()).default({}),
});

export async function GET() {
  return apiSuccess({
    modules: PFO_AI_MODULES,
    store: "pfo-addons",
    separatedFromOfficial13: true,
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "SKU AI-T/P/C inválido.", 400);
  try {
    const data = await runPfoAiModule({ userId: user!.id, sku: parsed.data.sku, input: parsed.data.input });
    return apiSuccess(data);
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    if (e instanceof AiCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha ao executar módulo de IA.", 500);
  }
}

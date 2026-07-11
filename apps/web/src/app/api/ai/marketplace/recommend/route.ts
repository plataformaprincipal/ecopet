import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { generateProductRecommendations } from "@/lib/ai/ai-recommendations";

const schema = z.object({
  query: z.string().max(500).optional(),
  locale: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Dados inválidos", 400);
  }

  const items = await generateProductRecommendations({
    userId: user.id,
    role: user.role,
    query: parsed.data.query,
    locale: parsed.data.locale,
  });

  return apiSuccess({
    recommendations: items.map((i) => ({
      ...i,
      sponsoredLabel: i.sponsored ? "Patrocinado" : undefined,
    })),
  });
}

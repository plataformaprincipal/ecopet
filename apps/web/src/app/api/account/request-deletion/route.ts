import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { createPrivacyRequest } from "@/lib/privacy/privacy-service";

const schema = z.object({
  description: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiFailure("UNAUTHORIZED", "Sessão expirada.", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  try {
    const req = await createPrivacyRequest({
      userId: user.id,
      type: "DELETE_ACCOUNT",
      description: parsed.data.description,
    });
    return apiSuccess({
      message: "Solicitação de exclusão registrada. Nossa equipe analisará em até 15 dias úteis.",
      requestId: req.id,
      status: req.status,
    });
  } catch (e) {
    if ((e as Error).message === "DUPLICATE_OPEN") {
      return apiFailure("CONFLICT", "Já existe uma solicitação em aberto.", 409);
    }
    return apiFailure("INTERNAL", "Não foi possível registrar a solicitação.", 500);
  }
}

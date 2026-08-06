import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { createPartnerPayout } from "@/lib/finance/payout";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const amountCents = Number(body.amountCents);
  const idempotencyKey =
    (typeof body.idempotencyKey === "string" && body.idempotencyKey) ||
    req.headers.get("idempotency-key") ||
    "";

  if (!idempotencyKey) {
    return apiFailure("VALIDATION", "idempotencyKey obrigatório", 400);
  }

  if (body.partnerId && body.partnerId !== user!.id) {
    return apiFailure("FORBIDDEN", "Não é permitido solicitar repasse de outro parceiro", 403);
  }

  const result = await createPartnerPayout({
    partnerId: user!.id,
    amountCents,
    requestedById: user!.id,
    idempotencyKey,
  });

  if (!result.ok) {
    return apiFailure(result.code, result.message, 400);
  }
  return apiSuccess(result);
}

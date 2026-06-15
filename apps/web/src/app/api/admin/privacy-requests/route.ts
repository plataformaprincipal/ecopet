import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listPrivacyRequestsForAdmin, updatePrivacyRequestStatus } from "@/lib/privacy/privacy-service";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const status = searchParams.get("status") ?? undefined;

  const data = await listPrivacyRequestsForAdmin({ page, limit, status });
  return apiSuccess(data);
}

const patchSchema = z.object({
  status: z.enum(["IN_REVIEW", "COMPLETED", "REJECTED"]),
  resolution: z.string().max(2000).optional(),
});

export async function PATCH(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const requestId = new URL(request.url).searchParams.get("id");
  if (!requestId) return apiFailure("VALIDATION", "Informe o id da solicitação.", 400);

  try {
    const updated = await updatePrivacyRequestStatus({
      requestId,
      adminId: user!.id,
      status: parsed.data.status,
      resolution: parsed.data.resolution,
    });
    return apiSuccess({ request: updated });
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND") {
      return apiFailure("NOT_FOUND", "Solicitação não encontrada.", 404);
    }
    return apiFailure("INTERNAL", "Erro ao atualizar solicitação.", 500);
  }
}

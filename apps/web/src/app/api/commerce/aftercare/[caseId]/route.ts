import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { AFTERCARE_STATUSES } from "@/lib/commerce/ops-policy";
import { updateAftercareCase } from "@/lib/commerce/aftercare";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(AFTERCARE_STATUSES),
  note: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ caseId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { caseId } = await context.params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiFailure("VALIDATION", "Status inválido.", 400);
    const role =
      user!.role === "ADMIN" || user!.role === "GESTOR"
        ? "admin"
        : user!.role === "CLIENT" || user!.role === "TUTOR"
          ? "buyer"
          : "seller";
    const updated = await updateAftercareCase({
      caseId,
      actorId: user!.id,
      role,
      status: parsed.data.status,
      note: parsed.data.note,
    });
    return apiSuccess({ case: updated });
  } catch (e) {
    return handleChatRouteError(e);
  }
}

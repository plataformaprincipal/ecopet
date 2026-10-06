import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth, requireClient } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { AFTERCARE_REASONS, AFTERCARE_STATUSES } from "@/lib/commerce/ops-policy";
import { listAftercareCases, openAftercareCase, updateAftercareCase } from "@/lib/commerce/aftercare";

export const dynamic = "force-dynamic";

const openSchema = z.object({
  orderId: z.string().min(1),
  itemId: z.string().optional(),
  reason: z.enum(AFTERCARE_REASONS),
  description: z.string().min(8).max(4000),
  requestedResolution: z.string().max(40).optional(),
});

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const role = user!.role;
    const cases = await listAftercareCases({
      admin: role === "ADMIN" || role === "GESTOR",
      buyerId: role === "CLIENT" || role === "TUTOR" ? user!.id : undefined,
      sellerId: ["PARTNER", "ONG", "CLINIC", "PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN"].includes(role)
        ? user!.id
        : undefined,
    });
    return apiSuccess({ cases });
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireClient();
    if (error) return error;
    const parsed = openSchema.safeParse(await request.json());
    if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos.", 400);
    const opened = await openAftercareCase({
      orderId: parsed.data.orderId,
      buyerId: user!.id,
      itemId: parsed.data.itemId,
      reason: parsed.data.reason,
      description: parsed.data.description,
      requestedResolution: parsed.data.requestedResolution,
    });
    return apiSuccess({ case: opened }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}

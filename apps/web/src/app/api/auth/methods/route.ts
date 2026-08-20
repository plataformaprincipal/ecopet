import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { getAccessMethods, unlinkGoogleFromUser } from "@/lib/auth/google-oauth-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const methods = await getAccessMethods(user!.id);
  if (!methods) return apiFailure("NOT_FOUND", "Usuário não encontrado.", 404);
  return apiSuccess({ methods });
}

export async function DELETE() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const result = await unlinkGoogleFromUser(user!.id);
  if (!result.ok) return apiFailure(result.code, result.code, 409);
  const methods = await getAccessMethods(user!.id);
  return apiSuccess({ methods });
}

import { getCurrentUser, sanitizeUser } from "@/lib/auth";
import { apiSuccess, apiFailure } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiFailure("UNAUTHORIZED", "Sessão expirada. Faça login novamente.", 401);
  }
  return apiSuccess({ user: sanitizeUser(user) });
}

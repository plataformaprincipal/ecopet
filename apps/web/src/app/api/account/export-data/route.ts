import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { createPrivacyRequest, exportUserData } from "@/lib/privacy/privacy-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiFailure("UNAUTHORIZED", "Sessão expirada.", 401);

  const data = await exportUserData(user.id);
  return apiSuccess(data);
}

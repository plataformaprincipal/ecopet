import { apiFailure } from "@/lib/api-response";
import { SocialError } from "@/lib/social/errors";

export function handleSocialRouteError(e: unknown) {
  if (e instanceof SocialError) {
    return apiFailure(e.code, e.message, e.status);
  }
  console.error("[social]", e);
  return apiFailure("INTERNAL", "Erro interno. Tente novamente.", 500);
}

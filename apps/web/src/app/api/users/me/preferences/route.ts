import { apiSuccess, apiFailure } from "@/lib/api-response";
import type { AccessibilityPreferences } from "@/lib/accessibility/types";
import {
  getUserPreferences,
  mergeUserPreferences,
  resolveAuthenticatedUserId,
} from "@/lib/user-preferences-server";

export async function GET(request: Request) {
  const userId = await resolveAuthenticatedUserId(request);
  if (!userId) {
    return apiFailure("UNAUTHORIZED", "Sessão expirada. Faça login novamente.", 401);
  }

  const preferences = await getUserPreferences(userId);
  return apiSuccess({ preferences });
}

export async function PATCH(request: Request) {
  const userId = await resolveAuthenticatedUserId(request);
  if (!userId) {
    return apiFailure("UNAUTHORIZED", "Sessão expirada. Faça login novamente.", 401);
  }

  let body: { a11y?: Partial<AccessibilityPreferences>; locale?: string };
  try {
    body = await request.json();
  } catch {
    return apiFailure("VALIDATION", "Corpo da requisição inválido.", 400);
  }

  if (!body.a11y && !body.locale) {
    return apiFailure("VALIDATION", "Nenhuma preferência informada.", 400);
  }

  const preferences = await mergeUserPreferences(userId, body);
  return apiSuccess({ preferences });
}

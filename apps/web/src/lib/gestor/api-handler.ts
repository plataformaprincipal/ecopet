import { apiFailure } from "@/lib/api-response";
import { GestorFilterError } from "@/lib/gestor/gestor-filters";

export function handleGestorRouteError(e: unknown) {
  if (e instanceof GestorFilterError) {
    return apiFailure("VALIDATION", e.message, 400);
  }
  console.error("[gestor]", e);
  return apiFailure("INTERNAL", "Erro interno. Tente novamente.", 500);
}

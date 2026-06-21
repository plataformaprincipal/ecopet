import { USER_ALREADY_REGISTERED_MESSAGE } from "@/lib/registration/document-messages";

/** Agrupa mensagens únicas de validação para exibição abaixo do botão Continuar. */
export function collectUniqueErrorMessages(errors: Record<string, string>): string[] {
  if (errors._duplicate?.trim()) {
    return [USER_ALREADY_REGISTERED_MESSAGE];
  }

  const values = [...new Set(Object.values(errors).filter((m) => m.trim().length > 0))];
  return values;
}

export function duplicateRegistrationError(): Record<string, string> {
  return { _duplicate: USER_ALREADY_REGISTERED_MESSAGE };
}

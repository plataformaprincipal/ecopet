import { messageForDuplicateCode, type DuplicateRegistrationCode } from "@/lib/registration/document-messages";

/** Agrupa mensagens únicas de validação para exibição abaixo do botão Continuar. */
export function collectUniqueErrorMessages(errors: Record<string, string>): string[] {
  if (errors._duplicate?.trim()) {
    return [errors._duplicate];
  }

  const values = [...new Set(Object.values(errors).filter((m) => m.trim().length > 0))];
  return values;
}

export function duplicateRegistrationError(
  code?: DuplicateRegistrationCode
): Record<string, string> {
  return { _duplicate: messageForDuplicateCode(code) };
}

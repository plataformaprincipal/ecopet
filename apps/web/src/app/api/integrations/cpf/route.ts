import { apiFailure, apiSuccess } from "@/lib/api-response";
import { lookupCpf } from "@/lib/integrations/cpf/cpf-service";
import { onlyDigits } from "@/schemas/validation/documents-shared";

export async function POST(request: Request) {
  let body: { cpf?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return apiFailure("VALIDATION", "Corpo inválido.", 400);
  }

  const cpf = body.cpf ?? "";
  const name = body.name?.trim() ?? "";
  if (!cpf || onlyDigits(cpf).length !== 11) {
    return apiFailure("VALIDATION", "Informe um CPF válido.", 400);
  }
  if (!name) {
    return apiFailure("VALIDATION", "Informe o nome completo.", 400);
  }

  const result = await lookupCpf(cpf, name);
  if (!result.valid) {
    return apiFailure("VALIDATION", result.message ?? "CPF inválido.", 400);
  }

  return apiSuccess({
    configured: result.configured,
    nameMatch: result.nameMatch,
    registeredName: result.registeredName,
    message: result.message,
    blocksRegistration: false,
  });
}

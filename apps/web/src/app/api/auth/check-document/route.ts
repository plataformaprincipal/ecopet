import {
  isDocumentGloballyAvailable,
  isValidDocumentFormat,
  normalizeDocumentDigits,
  type DocumentKind,
} from "@/lib/registration/document-availability";
import { apiSuccess, apiFailure } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") ?? "").toLowerCase() as DocumentKind;
    const raw = searchParams.get("value") ?? "";

    if (type !== "cpf" && type !== "cnpj") {
      return apiFailure("VALIDATION", "Tipo de documento inválido.", 400);
    }

    const digits = normalizeDocumentDigits(type, raw);
    if (!isValidDocumentFormat(type, digits)) {
      return apiFailure("VALIDATION", type === "cpf" ? "Digite um CPF válido." : "Digite um CNPJ válido.", 400);
    }

    const available = await isDocumentGloballyAvailable(type, digits);
    return apiSuccess({ type, value: digits, available });
  } catch {
    return apiFailure("UNEXPECTED", "Não foi possível verificar o documento.", 500);
  }
}

import { apiFailure, apiSuccess } from "@/lib/api-response";
import { lookupCnpj, normalizeCnpj } from "@/lib/integrations/cnpj/cnpj-service";
import { CNPJ_INVALID_MESSAGE } from "@/lib/integrations/cnpj/cnpj-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnpj = searchParams.get("cnpj");
  if (!cnpj) {
    return apiFailure("VALIDATION", "Informe o CNPJ.", 400);
  }

  const normalized = normalizeCnpj(cnpj);
  if (normalized.length !== 14) {
    return apiFailure("VALIDATION", CNPJ_INVALID_MESSAGE, 400);
  }

  const lookup = await lookupCnpj(normalized);
  if (!lookup.valid) {
    return apiFailure("VALIDATION", lookup.error ?? CNPJ_INVALID_MESSAGE, 400);
  }

  if (!lookup.result) {
    return apiSuccess({
      cnpj: normalized,
      found: false,
      provider: "brasilapi",
      message: lookup.error ?? "CNPJ não encontrado na base consultada.",
    });
  }

  return apiSuccess({
    found: true,
    provider: "brasilapi",
    data: lookup.result,
    warnings: lookup.result.warnings,
  });
}

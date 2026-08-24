import { apiFailure, apiSuccess } from "@/lib/api-response";
import { lookupCnpj, normalizeCnpj } from "@/lib/integrations/cnpj/cnpj-service";
import { inspectCnpjInput, cnpjIssueMessage } from "@/schemas/validation/documents-shared";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnpj = searchParams.get("cnpj");
  if (!cnpj) {
    return apiFailure("VALIDATION", "Informe o CNPJ.", 400, { fields: { cnpj: "Informe o CNPJ." } });
  }

  const normalized = normalizeCnpj(cnpj);
  const issue = inspectCnpjInput(normalized);
  if (issue !== "ok") {
    return apiFailure("INVALID_CNPJ", cnpjIssueMessage(issue), 400, { fields: { cnpj: cnpjIssueMessage(issue) } });
  }

  const lookup = await lookupCnpj(normalized);
  if (!lookup.valid) {
    return apiFailure("INVALID_CNPJ", lookup.error ?? cnpjIssueMessage("structure"), 400, {
      fields: { cnpj: lookup.error ?? cnpjIssueMessage("structure") },
    });
  }

  if (!lookup.result) {
    return apiSuccess({
      cnpj: normalized,
      found: false,
      unavailable: Boolean(lookup.unavailable),
      status: lookup.status,
      code: lookup.code ?? (lookup.unavailable ? "CNPJ_LOOKUP_UNAVAILABLE" : "CNPJ_NOT_FOUND"),
      provider: "brasilapi",
      message: lookup.error,
    });
  }

  return apiSuccess({
    found: true,
    status: lookup.status,
    provider: "brasilapi",
    data: lookup.result,
    warnings: lookup.result.warnings,
  });
}

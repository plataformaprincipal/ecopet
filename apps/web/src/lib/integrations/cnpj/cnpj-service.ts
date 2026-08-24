import {
  isValidCnpj,
  normalizeCnpj,
  inspectCnpjInput,
  cnpjIssueMessage,
  CNPJ_LOOKUP_UNAVAILABLE_MESSAGE,
  CNPJ_NOT_FOUND_MESSAGE,
} from "@/schemas/validation/documents-shared";
import {
  CNPJ_BAIXADO_MESSAGE,
  CNPJ_INAPTO_MESSAGE,
  type CnpjLookupCode,
  type CnpjLookupResult,
  type CnpjLookupStatus,
  type CnpjSecondaryCnae,
} from "./types";

export { normalizeCnpj, isValidCnpj } from "@/schemas/validation/documents-shared";

type BrasilApiCnpjResponse = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  situacao_cadastral?: number;
  data_inicio_atividade?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  complemento?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  cnaes_secundarios?: Array<{ codigo?: number; descricao?: string }>;
  natureza_juridica?: string;
  message?: string;
  type?: string;
};

export function getCnpjStatusWarnings(statusCode: number): string[] {
  if (statusCode === 8) return [CNPJ_BAIXADO_MESSAGE];
  if (statusCode === 4) return [CNPJ_INAPTO_MESSAGE];
  return [];
}

function formatCnae(code?: number, description?: string): CnpjSecondaryCnae {
  const codeStr = code != null ? String(code).padStart(7, "0") : "";
  return { code: codeStr, description: description?.trim() ?? "" };
}

export function parseBrasilApiCnpj(data: BrasilApiCnpjResponse, cnpj: string): CnpjLookupResult | null {
  if (!data.razao_social) return null;
  const statusCode = data.situacao_cadastral ?? 0;
  return {
    cnpj,
    legalName: data.razao_social.trim(),
    businessName: (data.nome_fantasia?.trim() || data.razao_social).trim(),
    registrationStatus: data.descricao_situacao_cadastral?.trim() ?? "",
    registrationStatusCode: statusCode,
    openingDate: data.data_inicio_atividade ?? null,
    address: {
      street: data.logradouro?.trim() ?? "",
      number: data.numero?.trim() ?? "",
      district: data.bairro?.trim() ?? "",
      city: data.municipio?.trim() ?? "",
      state: data.uf?.trim().toUpperCase() ?? "",
      zipCode: data.cep?.replace(/\D/g, "") ?? "",
      complement: data.complemento?.trim() || undefined,
    },
    mainCnae: formatCnae(data.cnae_fiscal, data.cnae_fiscal_descricao),
    secondaryCnaes: (data.cnaes_secundarios ?? [])
      .map((c) => formatCnae(c.codigo, c.descricao))
      .filter((c) => c.code || c.description),
    legalNature: data.natureza_juridica?.trim() ?? "",
    provider: "brasilapi",
    warnings: getCnpjStatusWarnings(statusCode),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"));
}

export async function fetchCnpjFromBrasilApi(
  cnpj: string,
  signal?: AbortSignal
): Promise<{ result: CnpjLookupResult | null; status: Exclude<CnpjLookupStatus, "INVALID"> }> {
  const normalized = normalizeCnpj(cnpj);
  if (!isValidCnpj(normalized)) {
    return { result: null, status: "NOT_FOUND" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  let res: Response;
  try {
    res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    if (isAbortError(error)) throw new Error("CNPJ_LOOKUP_TIMEOUT");
    throw new Error("CNPJ_LOOKUP_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }

  if (res.status === 404) return { result: null, status: "NOT_FOUND" };
  if (res.status === 400 || res.status >= 500) throw new Error("CNPJ_LOOKUP_UNAVAILABLE");
  if (!res.ok) throw new Error("CNPJ_LOOKUP_UNAVAILABLE");

  const data = (await res.json()) as BrasilApiCnpjResponse;
  if (data.type === "bad_request") throw new Error("CNPJ_LOOKUP_UNAVAILABLE");
  if (data.message && !data.razao_social) return { result: null, status: "NOT_FOUND" };
  const parsed = parseBrasilApiCnpj(data, normalized);
  if (!parsed) return { result: null, status: "NOT_FOUND" };
  return { result: parsed, status: "SUCCESS" };
}

export async function lookupCnpj(
  cnpj: string,
  signal?: AbortSignal
): Promise<{
  valid: boolean;
  result: CnpjLookupResult | null;
  status: CnpjLookupStatus;
  code?: CnpjLookupCode;
  unavailable?: boolean;
  error?: string;
}> {
  const normalized = normalizeCnpj(cnpj);
  const issue = inspectCnpjInput(normalized);
  if (issue !== "ok") {
    return {
      valid: false,
      result: null,
      status: "INVALID",
      code: "INVALID_CNPJ",
      error: cnpjIssueMessage(issue),
    };
  }

  try {
    const lookup = await fetchCnpjFromBrasilApi(normalized, signal);
    if (lookup.status === "SUCCESS") {
      return { valid: true, result: lookup.result, status: "SUCCESS" };
    }
    return {
      valid: true,
      result: null,
      status: "NOT_FOUND",
      code: "CNPJ_NOT_FOUND",
      error: CNPJ_NOT_FOUND_MESSAGE,
    };
  } catch (error) {
    const timeout = error instanceof Error && error.message === "CNPJ_LOOKUP_TIMEOUT";
    return {
      valid: true,
      result: null,
      status: timeout ? "TIMEOUT" : "UNAVAILABLE",
      code: timeout ? "NETWORK_ERROR" : "CNPJ_LOOKUP_UNAVAILABLE",
      unavailable: true,
      error: CNPJ_LOOKUP_UNAVAILABLE_MESSAGE,
    };
  }
}

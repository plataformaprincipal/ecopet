import { onlyDigits, validateCnpjChecksum } from "@/schemas/validation/documents-shared";
import {
  CNPJ_BAIXADO_MESSAGE,
  CNPJ_INAPTO_MESSAGE,
  type CnpjLookupResult,
  type CnpjSecondaryCnae,
} from "./types";

export const CNPJ_INVALID_MESSAGE = "Digite um CNPJ válido.";

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

export function normalizeCnpj(input: string): string {
  return onlyDigits(input).slice(0, 14);
}

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

export async function fetchCnpjFromBrasilApi(cnpj: string, signal?: AbortSignal): Promise<CnpjLookupResult | null> {
  const normalized = normalizeCnpj(cnpj);
  if (!validateCnpjChecksum(normalized)) return null;

  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${normalized}`, {
    signal,
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Falha ao consultar CNPJ. Tente novamente.");

  const data = (await res.json()) as BrasilApiCnpjResponse;
  if (data.type === "bad_request" || data.message) return null;
  return parseBrasilApiCnpj(data, normalized);
}

export async function lookupCnpj(cnpj: string, signal?: AbortSignal): Promise<{
  valid: boolean;
  result: CnpjLookupResult | null;
  error?: string;
}> {
  const normalized = normalizeCnpj(cnpj);
  if (normalized.length !== 14 || !validateCnpjChecksum(normalized)) {
    return { valid: false, result: null, error: CNPJ_INVALID_MESSAGE };
  }
  try {
    const result = await fetchCnpjFromBrasilApi(normalized, signal);
    return { valid: true, result };
  } catch (e) {
    return {
      valid: true,
      result: null,
      error: e instanceof Error ? e.message : "Consulta de CNPJ indisponível.",
    };
  }
}

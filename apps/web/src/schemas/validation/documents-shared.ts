export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Remove apenas formatação (espaço, ponto, barra, hífen). Preserva A–Z e 0–9. */
const CNPJ_FORMATTING = /[.\-/\s]/g;
const CNPJ_WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_WEIGHTS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export const CNPJ_EMPTY_MESSAGE = "Informe o CNPJ.";
export const CNPJ_INCOMPLETE_MESSAGE = "Continue digitando o CNPJ.";
export const CNPJ_STRUCTURE_MESSAGE = "Confira o CNPJ informado.";
export const CNPJ_CHECK_DIGIT_MESSAGE = "CNPJ com dígitos verificadores inválidos.";
export const CNPJ_LOOKUP_LOADING_MESSAGE = "Consultando dados da empresa…";
export const CNPJ_LOOKUP_FOUND_MESSAGE = "CNPJ localizado.";
export const CNPJ_LOOKUP_UNAVAILABLE_MESSAGE =
  "Não conseguimos consultar os dados automaticamente. Você pode continuar preenchendo-os manualmente.";
export const CNPJ_NOT_FOUND_MESSAGE =
  "CNPJ não encontrado na base consultada. Você pode continuar preenchendo os dados manualmente.";

export type CnpjFieldIssue = "empty" | "incomplete" | "structure" | "check_digit" | "ok";

/**
 * Normalização canônica do CNPJ (numérico legado e alfanumérico 2026).
 * Não usar onlyDigits / replace(\\D) — isso destrói letras válidas.
 */
export function normalizeCnpj(input: string): string {
  return input.trim().toUpperCase().replace(CNPJ_FORMATTING, "");
}

export function cnpjCharValue(character: string): number {
  return character.charCodeAt(0) - 48;
}

function cnpjCheckDigit(chars: string, weights: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += cnpjCharValue(chars[i]) * weights[i];
  }
  const rest = sum % 11;
  return rest === 0 || rest === 1 ? 0 : 11 - rest;
}

export function isCompleteCnpjStructure(normalized: string): boolean {
  return /^[0-9A-Z]{12}\d{2}$/.test(normalized);
}

function isRepeatedNumericCnpj(normalized: string): boolean {
  return /^\d{14}$/.test(normalized) && /^(\d)\1{13}$/.test(normalized);
}

function cnpjCheckDigitsMatch(normalized: string): boolean {
  if (!isCompleteCnpjStructure(normalized)) return false;
  const base = normalized.slice(0, 12);
  const dv1 = cnpjCheckDigit(base, CNPJ_WEIGHTS_DV1);
  if (dv1 !== Number(normalized[12])) return false;
  const dv2 = cnpjCheckDigit(`${base}${dv1}`, CNPJ_WEIGHTS_DV2);
  return dv2 === Number(normalized[13]);
}

/** Validador único: CNPJ numérico legado + alfanumérico RFB 2026. */
export function isValidCnpj(input: string): boolean {
  return inspectCnpjInput(input) === "ok";
}

/** Alias canônico — mesmo motor de isValidCnpj. */
export function validateCnpjChecksum(cnpj: string): boolean {
  return isValidCnpj(cnpj);
}

export function inspectCnpjInput(input: string): CnpjFieldIssue {
  const normalized = normalizeCnpj(input);
  if (!normalized) return "empty";
  if (/[^0-9A-Z]/.test(normalized)) return "structure";
  if (normalized.length < 14) return "incomplete";
  if (normalized.length > 14) return "structure";
  if (!isCompleteCnpjStructure(normalized)) return "structure";
  if (isRepeatedNumericCnpj(normalized)) return "check_digit";
  if (!cnpjCheckDigitsMatch(normalized)) return "check_digit";
  return "ok";
}

export function cnpjIssueMessage(issue: CnpjFieldIssue): string {
  switch (issue) {
    case "empty":
      return CNPJ_EMPTY_MESSAGE;
    case "incomplete":
      return CNPJ_INCOMPLETE_MESSAGE;
    case "structure":
      return CNPJ_STRUCTURE_MESSAGE;
    case "check_digit":
      return CNPJ_CHECK_DIGIT_MESSAGE;
    default:
      return "";
  }
}

export function validateCpfChecksum(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(d[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(d[10], 10);
}

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Máscara visual AA.AAA.AAA/AAAA-DV — aceita letras. Não usar inputMode numeric. */
export function maskCnpj(value: string): string {
  const d = normalizeCnpj(value)
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskDocument(value: string, type: "CPF" | "CNPJ"): string {
  return type === "CPF" ? maskCpf(value) : maskCnpj(value);
}

export {
  onlyDigits,
  validateCpfChecksum,
  validateCnpjChecksum,
  maskCpf,
  maskCnpj,
  maskPhone,
} from "./documents-shared";

import {
  validateCpfChecksum,
  inspectCnpjInput,
  cnpjIssueMessage,
  CNPJ_STRUCTURE_MESSAGE,
} from "./documents-shared";
import {
  BIRTH_DATE_FUTURE_MESSAGE,
  todayIsoDate,
  validateBirthDate,
  validateOptionalBirthDate,
} from "./dates";

export { BIRTH_DATE_FUTURE_MESSAGE, todayIsoDate, validateBirthDate, validateOptionalBirthDate };

export const USER_MESSAGES = {
  BIRTH_DATE_FUTURE: BIRTH_DATE_FUTURE_MESSAGE,
  CPF_INVALID: "CPF inválido. Verifique os números informados.",
  CNPJ_INVALID: CNPJ_STRUCTURE_MESSAGE,
  CONNECTION: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
  DATABASE: "Não foi possível concluir o cadastro no momento. Tente novamente em instantes.",
  VALIDATION: "Alguns campos precisam ser corrigidos antes de continuar.",
  PERMISSION: "Você não tem permissão para acessar esta área.",
  SESSION: "Sua sessão expirou. Faça login novamente.",
  UNEXPECTED: "Ocorreu um erro inesperado. Tente novamente. Se persistir, entre em contato com o suporte.",
} as const;

export function validateCpfField(value: unknown): string | undefined {
  const d = String(value ?? "").replace(/\D/g, "");
  if (d.length !== 11) return USER_MESSAGES.CPF_INVALID;
  if (!validateCpfChecksum(d)) return USER_MESSAGES.CPF_INVALID;
  return undefined;
}

export function validateCnpjField(value: unknown): string | undefined {
  const issue = inspectCnpjInput(String(value ?? ""));
  if (issue === "ok") return undefined;
  return cnpjIssueMessage(issue);
}

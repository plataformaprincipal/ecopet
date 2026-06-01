export {
  onlyDigits,
  validateCpfChecksum,
  validateCnpjChecksum,
  maskCpf,
  maskCnpj,
  maskPhone,
} from "./documents-shared";

import { validateCpfChecksum, validateCnpjChecksum } from "./documents-shared";

export const USER_MESSAGES = {
  BIRTH_DATE_FUTURE: "A data de nascimento não pode ser futura. Informe uma data válida.",
  CPF_INVALID: "CPF inválido. Verifique os números informados.",
  CNPJ_INVALID: "CNPJ inválido. Verifique os números informados.",
  CONNECTION: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
  DATABASE: "Não foi possível salvar seus dados agora. Tente novamente em instantes.",
  VALIDATION: "Alguns campos precisam ser corrigidos antes de continuar.",
  PERMISSION: "Você não tem permissão para acessar esta área.",
  SESSION: "Sua sessão expirou. Faça login novamente.",
  UNEXPECTED: "Ocorreu um erro inesperado. Tente novamente. Se persistir, entre em contato com o suporte.",
} as const;

export function validateBirthDate(value: string): string | undefined {
  if (!value) return "Data de nascimento é obrigatória";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data de nascimento inválida";
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) return USER_MESSAGES.BIRTH_DATE_FUTURE;
  return undefined;
}

export function validateCpfField(value: unknown): string | undefined {
  const d = String(value ?? "").replace(/\D/g, "");
  if (d.length !== 11) return USER_MESSAGES.CPF_INVALID;
  if (!validateCpfChecksum(d)) return USER_MESSAGES.CPF_INVALID;
  return undefined;
}

export function validateCnpjField(value: unknown): string | undefined {
  const d = String(value ?? "").replace(/\D/g, "");
  if (d.length !== 14) return USER_MESSAGES.CNPJ_INVALID;
  if (!validateCnpjChecksum(d)) return USER_MESSAGES.CNPJ_INVALID;
  return undefined;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

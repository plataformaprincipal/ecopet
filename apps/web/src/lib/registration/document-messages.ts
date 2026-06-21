/** Mensagem pública única para qualquer dado já cadastrado (e-mail, telefone, CPF, CNPJ, username). */
export const USER_ALREADY_REGISTERED_MESSAGE = "Usuário já cadastrado.";

/** @deprecated Use USER_ALREADY_REGISTERED_MESSAGE na UI */
export const CPF_DUPLICATE_MESSAGE = USER_ALREADY_REGISTERED_MESSAGE;

/** @deprecated Use USER_ALREADY_REGISTERED_MESSAGE na UI */
export const CNPJ_DUPLICATE_MESSAGE = USER_ALREADY_REGISTERED_MESSAGE;

export const DUPLICATE_REGISTRATION_CODES = [
  "EMAIL_DUPLICATE",
  "PHONE_DUPLICATE",
  "CPF_DUPLICATE",
  "CNPJ_DUPLICATE",
  "USERNAME_DUPLICATE",
] as const;

export type DuplicateRegistrationCode = (typeof DUPLICATE_REGISTRATION_CODES)[number];

export function isDuplicateRegistrationCode(code?: string): code is DuplicateRegistrationCode {
  return DUPLICATE_REGISTRATION_CODES.includes(code as DuplicateRegistrationCode);
}

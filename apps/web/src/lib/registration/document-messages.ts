/** Mensagem genérica legada — preferir messageForDuplicateCode. */
export const USER_ALREADY_REGISTERED_MESSAGE = "Usuário já cadastrado.";

export const EMAIL_DUPLICATE_MESSAGE = "Este e-mail já está cadastrado.";
export const PHONE_DUPLICATE_MESSAGE = "Este telefone já está cadastrado.";
export const USERNAME_DUPLICATE_MESSAGE = "Este nome de usuário já está em uso.";
export const CPF_DUPLICATE_MESSAGE = "Este CPF já possui cadastro.";
export const CNPJ_DUPLICATE_MESSAGE = "Este CNPJ já possui cadastro.";

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

export function messageForDuplicateCode(code?: string): string {
  switch (code) {
    case "EMAIL_DUPLICATE":
      return EMAIL_DUPLICATE_MESSAGE;
    case "PHONE_DUPLICATE":
      return PHONE_DUPLICATE_MESSAGE;
    case "CPF_DUPLICATE":
      return CPF_DUPLICATE_MESSAGE;
    case "CNPJ_DUPLICATE":
      return CNPJ_DUPLICATE_MESSAGE;
    case "USERNAME_DUPLICATE":
      return USERNAME_DUPLICATE_MESSAGE;
    default:
      return USER_ALREADY_REGISTERED_MESSAGE;
  }
}

export function duplicateFieldFromPrismaTarget(target?: unknown): DuplicateRegistrationCode | null {
  const fields = Array.isArray(target)
    ? target.map((v) => String(v).toLowerCase())
    : typeof target === "string"
      ? [target.toLowerCase()]
      : [];
  if (fields.some((f) => f.includes("email"))) return "EMAIL_DUPLICATE";
  if (fields.some((f) => f.includes("phone") || f.includes("telefone"))) return "PHONE_DUPLICATE";
  if (fields.some((f) => f.includes("username"))) return "USERNAME_DUPLICATE";
  if (fields.some((f) => f.includes("cpf"))) return "CPF_DUPLICATE";
  if (fields.some((f) => f.includes("cnpj"))) return "CNPJ_DUPLICATE";
  return null;
}

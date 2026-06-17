import { USER_MESSAGES } from "@/schemas/validation/documents";

export type ApiFailurePayload = {
  error?: string | { code?: string; message?: string };
  code?: string;
};

const REGISTER_CONFLICT_MESSAGES: Record<string, string> = {
  EMAIL_DUPLICATE: "Este e-mail já está cadastrado.",
  CPF_DUPLICATE: "Este CPF já está cadastrado.",
  CNPJ_DUPLICATE: "Este CNPJ já está cadastrado.",
};

export function parseApiFailureError(body: ApiFailurePayload): { code?: string; message: string } {
  if (body.error && typeof body.error === "object" && body.error.message) {
    return { code: body.error.code, message: body.error.message };
  }
  const message = typeof body.error === "string" ? body.error : "";
  const code = typeof body.code === "string" ? body.code : undefined;
  return { code, message };
}

export function mapRegisterConflictMessage(code?: string, message?: string): string {
  if (code && REGISTER_CONFLICT_MESSAGES[code]) {
    return REGISTER_CONFLICT_MESSAGES[code];
  }
  if (message) return message;
  return USER_MESSAGES.UNEXPECTED;
}

const TECHNICAL_PATTERNS = [
  /internal server error/i,
  /undefined/i,
  /prisma/i,
  /validation failed/i,
  /\b500\b/,
  /unauthorized/i,
  /not found/i,
  /failed to fetch/i,
  /network error/i,
];

export function mapApiErrorMessage(message: string, code?: string): string {
  if (code === "USER_NOT_FOUND") return message;
  if (code === "USER_OR_PASSWORD_INCORRECT") return message;
  if (code === "ACCOUNT_UNAVAILABLE" || code === "ACCOUNT_LOCKED" || code === "EMAIL_NOT_VERIFIED") return message;
  if (code === "EMAIL_DUPLICATE" || code === "CPF_DUPLICATE" || code === "CNPJ_DUPLICATE" || code === "PHONE_DUPLICATE") {
    return message;
  }
  if (code === "VALIDATION") return message || USER_MESSAGES.VALIDATION;
  if (code === "DATABASE") return USER_MESSAGES.DATABASE;
  if (code === "UNEXPECTED") return USER_MESSAGES.UNEXPECTED;
  if (code === "SESSION") return USER_MESSAGES.SESSION;
  if (code === "PERMISSION") return USER_MESSAGES.PERMISSION;

  if (!message || TECHNICAL_PATTERNS.some((p) => p.test(message))) {
    return USER_MESSAGES.UNEXPECTED;
  }
  return message;
}

export class ApiRequestError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

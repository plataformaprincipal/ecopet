import { USER_MESSAGES } from "@/lib/validation/documents";

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

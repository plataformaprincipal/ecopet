import { USER_MESSAGES } from "@/schemas/validation/documents";
import {
  USER_ALREADY_REGISTERED_MESSAGE,
  isDuplicateRegistrationCode,
} from "@/lib/registration/document-messages";

export type ApiFailurePayload = {
  error?: string | { code?: string; message?: string };
  code?: string;
};

export function parseApiFailureError(body: ApiFailurePayload): { code?: string; message: string } {
  if (body.error && typeof body.error === "object" && body.error.message) {
    return { code: body.error.code, message: body.error.message };
  }
  const message = typeof body.error === "string" ? body.error : "";
  const code = typeof body.code === "string" ? body.code : undefined;
  return { code, message };
}

export function mapRegisterConflictMessage(code?: string, _message?: string): string {
  if (isDuplicateRegistrationCode(code)) {
    return USER_ALREADY_REGISTERED_MESSAGE;
  }
  if (_message) return _message;
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
  if (isDuplicateRegistrationCode(code)) {
    return USER_ALREADY_REGISTERED_MESSAGE;
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

import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "INTERNAL";

const MESSAGE_KEYS: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "errors.unauthorized",
  FORBIDDEN: "errors.forbidden",
  NOT_FOUND: "errors.notFound",
  VALIDATION: "errors.validation",
  CONFLICT: "errors.conflict",
  INTERNAL: "errors.internal",
};

export function apiError(code: ApiErrorCode, status: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: {
        code,
        messageKey: MESSAGE_KEYS[code] ?? "errors.internal",
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function apiValidationError(messageKey = "errors.validation", details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: {
        code: "VALIDATION",
        messageKey,
        ...(details ? { details } : {}),
      },
    },
    { status: 400 }
  );
}

export function apiConflict(messageKey = "errors.conflict") {
  return NextResponse.json(
    {
      error: {
        code: "CONFLICT",
        messageKey,
      },
    },
    { status: 409 }
  );
}

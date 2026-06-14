import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type ApiSuccessBody<T = unknown> = { success: true; data?: T };
export type ApiFailureBody = { success: false; error: { code: string; message: string } };

export function apiSuccess<T>(data?: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccessBody<T>, { status });
}

export function apiFailure(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } } satisfies ApiFailureBody,
    { status }
  );
}

/** @deprecated Prefer apiFailure com mensagem explícita */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "INTERNAL";

const LEGACY_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Recurso não encontrado.",
  VALIDATION: "Alguns campos precisam ser corrigidos.",
  CONFLICT: "Conflito com dados existentes.",
  INTERNAL: "Erro interno. Tente novamente.",
};

export function apiError(code: ApiErrorCode, status: number) {
  return apiFailure(code, LEGACY_MESSAGES[code] ?? LEGACY_MESSAGES.INTERNAL, status);
}

export function apiValidationError(message = LEGACY_MESSAGES.VALIDATION) {
  return apiFailure("VALIDATION", message, 400);
}

export function apiConflict(message = LEGACY_MESSAGES.CONFLICT) {
  return apiFailure("CONFLICT", message, 409);
}

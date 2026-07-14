import { NextResponse } from "next/server";
import { apiFailure } from "@/lib/api-response";

export const INTEGRATION_ERROR_CODES = {
  INTEGRATION_NOT_CONFIGURED: "INTEGRATION_NOT_CONFIGURED",
  INTEGRATION_UNAVAILABLE: "INTEGRATION_UNAVAILABLE",
  INTEGRATION_DISABLED: "INTEGRATION_DISABLED",
  INTEGRATION_UNKNOWN: "INTEGRATION_UNKNOWN",
  AI_NOT_CONFIGURED: "AI_NOT_CONFIGURED",
  EMAIL_NOT_CONFIGURED: "EMAIL_NOT_CONFIGURED",
  SMS_NOT_CONFIGURED: "SMS_NOT_CONFIGURED",
  PAYMENT_NOT_CONFIGURED: "PAYMENT_NOT_CONFIGURED",
  CHAT_NOT_CONFIGURED: "CHAT_NOT_CONFIGURED",
  PUSH_NOT_CONFIGURED: "PUSH_NOT_CONFIGURED",
  MEDIA_NOT_CONFIGURED: "MEDIA_NOT_CONFIGURED",
} as const;

export type IntegrationErrorCode =
  (typeof INTEGRATION_ERROR_CODES)[keyof typeof INTEGRATION_ERROR_CODES];

/** @deprecated Prefer INTEGRATION_ERROR_CODES */
export const PHASE1_INTEGRATION_ERROR_CODES = INTEGRATION_ERROR_CODES;
/** @deprecated Prefer IntegrationErrorCode */
export type Phase1IntegrationErrorCode = IntegrationErrorCode;

export type IntegrationErrorDetails = {
  provider?: string;
  missingVariables?: string[];
  status?: string;
};

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly details: IntegrationErrorDetails;
  readonly httpStatus: number;

  constructor(
    code: IntegrationErrorCode,
    message: string,
    details: IntegrationErrorDetails = {},
    httpStatus = 503
  ) {
    super(message);
    this.name = "IntegrationError";
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus;
  }
}

const PROVIDER_CODE_MAP: Record<string, IntegrationErrorCode> = {
  openai: INTEGRATION_ERROR_CODES.AI_NOT_CONFIGURED,
  resend: INTEGRATION_ERROR_CODES.EMAIL_NOT_CONFIGURED,
  twilio: INTEGRATION_ERROR_CODES.SMS_NOT_CONFIGURED,
  talkjs: INTEGRATION_ERROR_CODES.CHAT_NOT_CONFIGURED,
  cloudinary: INTEGRATION_ERROR_CODES.MEDIA_NOT_CONFIGURED,
  mercado_pago: INTEGRATION_ERROR_CODES.PAYMENT_NOT_CONFIGURED,
  stripe: INTEGRATION_ERROR_CODES.PAYMENT_NOT_CONFIGURED,
  push: INTEGRATION_ERROR_CODES.PUSH_NOT_CONFIGURED,
};

export function codeForProvider(providerId: string): IntegrationErrorCode {
  return PROVIDER_CODE_MAP[providerId] ?? INTEGRATION_ERROR_CODES.INTEGRATION_NOT_CONFIGURED;
}

/** Resposta JSON no estilo AI_NOT_CONFIGURED para rotas de API. */
export function integrationApiFailure(
  code: IntegrationErrorCode | string,
  message: string,
  status = 503,
  extra?: Record<string, unknown>
): NextResponse {
  if (!extra) {
    return apiFailure(code, message, status);
  }
  return NextResponse.json(
    {
      success: false as const,
      error: { code, message, ...extra },
    },
    { status }
  );
}

export const AI_NOT_CONFIGURED_USER_MESSAGE =
  "Os recursos de inteligência artificial ainda não estão disponíveis neste ambiente.";

export function aiNotConfiguredResponse(
  message = AI_NOT_CONFIGURED_USER_MESSAGE
): NextResponse {
  return integrationApiFailure(INTEGRATION_ERROR_CODES.AI_NOT_CONFIGURED, message, 503);
}

export function toIntegrationApiFailure(error: unknown): NextResponse {
  if (error instanceof IntegrationError) {
    return integrationApiFailure(error.code, error.message, error.httpStatus, {
      provider: error.details.provider,
      missingVariables: error.details.missingVariables,
      status: error.details.status,
    });
  }
  return apiFailure("INTERNAL", "Erro interno de integração.", 500);
}

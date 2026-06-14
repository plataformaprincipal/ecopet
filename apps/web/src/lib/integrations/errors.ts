export const INTEGRATION_ERROR_CODES = {
  UPLOAD_NOT_CONFIGURED: "UPLOAD_NOT_CONFIGURED",
  EMAIL_NOT_CONFIGURED: "EMAIL_NOT_CONFIGURED",
  PAYMENT_GATEWAY_NOT_CONFIGURED: "PAYMENT_GATEWAY_NOT_CONFIGURED",
  OPENAI_NOT_CONFIGURED: "OPENAI_NOT_CONFIGURED",
  MAPS_NOT_CONFIGURED: "MAPS_NOT_CONFIGURED",
  SHIPPING_NOT_CONFIGURED: "SHIPPING_NOT_CONFIGURED",
  ERP_NOT_CONFIGURED: "ERP_NOT_CONFIGURED",
  WHATSAPP_NOT_CONFIGURED: "WHATSAPP_NOT_CONFIGURED",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  UPLOAD_DEV_BLOCKED: "UPLOAD_DEV_BLOCKED",
} as const;

export type IntegrationErrorCode = (typeof INTEGRATION_ERROR_CODES)[keyof typeof INTEGRATION_ERROR_CODES];

export class IntegrationNotConfiguredError extends Error {
  readonly code: IntegrationErrorCode;

  constructor(code: IntegrationErrorCode, message: string) {
    super(message);
    this.name = "IntegrationNotConfiguredError";
    this.code = code;
  }
}

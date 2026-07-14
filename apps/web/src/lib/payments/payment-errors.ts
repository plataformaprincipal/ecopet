/**
 * Payment domain errors — never treat missing keys as paid/success.
 */

export const PAYMENT_ERROR_CODES = {
  NOT_CONFIGURED: "PAYMENT_NOT_CONFIGURED",
  PROVIDER_UNAVAILABLE: "PAYMENT_PROVIDER_UNAVAILABLE",
  INTENT_FAILED: "PAYMENT_INTENT_FAILED",
  INVALID_WEBHOOK: "PAYMENT_INVALID_WEBHOOK",
  CANCEL_FAILED: "PAYMENT_CANCEL_FAILED",
  REFUND_FAILED: "PAYMENT_REFUND_FAILED",
  STATUS_UNKNOWN: "PAYMENT_STATUS_UNKNOWN",
} as const;

export type PaymentErrorCode = (typeof PAYMENT_ERROR_CODES)[keyof typeof PAYMENT_ERROR_CODES];

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly status: number;

  constructor(code: PaymentErrorCode, message: string, status = 400) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.status = status;
  }
}

export class PaymentNotConfiguredError extends PaymentError {
  constructor(message = "Gateway de pagamento não configurado.") {
    super(PAYMENT_ERROR_CODES.NOT_CONFIGURED, message, 503);
    this.name = "PaymentNotConfiguredError";
  }
}

export function isPaymentNotConfiguredError(err: unknown): err is PaymentNotConfiguredError {
  return (
    err instanceof PaymentNotConfiguredError ||
    (err instanceof PaymentError && err.code === PAYMENT_ERROR_CODES.NOT_CONFIGURED)
  );
}

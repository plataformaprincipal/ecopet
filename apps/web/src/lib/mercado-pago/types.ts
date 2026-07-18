/** Tipos tipados da API Orders (Checkout Transparente) — sem any. */

export type MpOrderStatus =
  | "created"
  | "processed"
  | "processing"
  | "action_required"
  | "cancelled"
  | "expired"
  | "refunded"
  | "charged_back"
  | "failed"
  | string;

export type MpPaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "ticket"
  | "bank_transfer"
  | string;

export type CreateMpOrderPaymentMethod = {
  id: string;
  type?: MpPaymentMethodType;
  token?: string;
  installments?: number;
  statement_descriptor?: string;
};

export type CreateMpOrderRequest = {
  type: "online";
  processing_mode?: "automatic" | "manual";
  external_reference: string;
  total_amount?: string;
  description?: string;
  payer?: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: { type: string; number: string };
  };
  transactions: {
    payments: Array<{
      amount: string;
      payment_method: CreateMpOrderPaymentMethod;
      expiration_time?: string;
    }>;
  };
};

export type MpOrderPayment = {
  id?: string;
  amount?: string;
  status?: string;
  status_detail?: string;
  payment_method?: {
    id?: string;
    type?: string;
    ticket_url?: string;
    qr_code?: string;
    qr_code_base64?: string;
  };
};

export type MpOrderResponse = {
  id: string;
  type?: string;
  status?: MpOrderStatus;
  status_detail?: string;
  external_reference?: string;
  total_amount?: string;
  transactions?: {
    payments?: MpOrderPayment[];
  };
  processing_mode?: string;
};

export type MpApiErrorBody = {
  message?: string;
  error?: string;
  status?: number;
  cause?: Array<{ code?: string; description?: string; data?: string }>;
};

export type MpClientResult<T> =
  | { ok: true; data: T; status: number }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      retryable: boolean;
    };

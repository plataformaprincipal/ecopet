/**
 * Contrato mínimo do provedor de pagamento oficial (Fase 2).
 * Provedor escolhido: Mercado Pago (sandbox). Stripe permanece stub/fora do fluxo.
 */
import "server-only";

import {
  createMercadoPagoCheckoutOrder,
  getMercadoPagoCheckoutOrderForUser,
  type CreateCheckoutOrderInput,
} from "@/lib/mercado-pago/create-checkout-order";
import { cancelPendingMercadoPagoPayment } from "@/lib/mercado-pago/cancellations";
import { requestClientRefund } from "@/lib/mercado-pago/refunds";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mercado-pago/webhook-signature";

export const OFFICIAL_PAYMENT_PROVIDER = "mercado_pago" as const;

export type PaymentProviderContract = {
  createPayment: typeof createMercadoPagoCheckoutOrder;
  getPayment: typeof getMercadoPagoCheckoutOrderForUser;
  cancelPayment: typeof cancelPendingMercadoPagoPayment;
  refundPayment: typeof requestClientRefund;
  verifyWebhook: typeof verifyMercadoPagoWebhookSignature;
};

export const paymentProvider: PaymentProviderContract = {
  createPayment: createMercadoPagoCheckoutOrder,
  getPayment: getMercadoPagoCheckoutOrderForUser,
  cancelPayment: cancelPendingMercadoPagoPayment,
  refundPayment: requestClientRefund,
  verifyWebhook: verifyMercadoPagoWebhookSignature,
};

export type { CreateCheckoutOrderInput };

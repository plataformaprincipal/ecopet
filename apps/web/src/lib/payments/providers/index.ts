/**
 * Provider registry — re-exports concrete adapters for the payment architecture.
 */

export { ManualPaymentProvider } from "@/lib/payments/providers/manual";
export { MercadoPagoPaymentProvider } from "@/lib/payments/providers/mercado-pago";
export { StripePaymentProvider } from "@/lib/payments/providers/stripe";

import type { PaymentProvider, PaymentProviderId } from "@/lib/payments/payment-provider";
import { ManualPaymentProvider } from "@/lib/payments/providers/manual";
import { MercadoPagoPaymentProvider } from "@/lib/payments/providers/mercado-pago";
import { StripePaymentProvider } from "@/lib/payments/providers/stripe";

/** @deprecated Prefer resolvePaymentProvider from payment-service */
export function resolvePaymentProviderAdapter(id: PaymentProviderId | string): PaymentProvider {
  switch (String(id).toLowerCase()) {
    case "mercado_pago":
    case "mercadopago":
    case "mercado-pago":
      return new MercadoPagoPaymentProvider();
    case "stripe":
      return new StripePaymentProvider();
    case "manual":
    case "none":
    case "pagarme":
    default:
      return new ManualPaymentProvider();
  }
}

/** Legacy adapter surface used by older imports */
export type PaymentProviderAdapter = PaymentProvider;

export {
  MercadoPagoPaymentProvider as MercadoPagoProvider,
  StripePaymentProvider as StripeProvider,
};

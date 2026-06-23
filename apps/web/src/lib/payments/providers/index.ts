import type { CreatePaymentIntentInput, PaymentIntentResult, PaymentProvider } from "@/lib/payments/gateway";

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
}

export class MercadoPagoProvider implements PaymentProviderAdapter {
  readonly provider = "MERCADO_PAGO" as const;

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    // Integração real: SDK mercadopago quando MERCADO_PAGO_ACCESS_TOKEN estiver configurado
    return {
      provider: this.provider,
      status: "NOT_CONFIGURED",
      externalId: undefined,
      checkoutUrl: undefined,
    };
  }
}

export class StripeProvider implements PaymentProviderAdapter {
  readonly provider = "STRIPE" as const;

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      provider: this.provider,
      status: "NOT_CONFIGURED",
    };
  }
}

export class PagarmeProvider implements PaymentProviderAdapter {
  readonly provider = "PAGARME" as const;

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      provider: this.provider,
      status: "NOT_CONFIGURED",
    };
  }
}

export function resolvePaymentProviderAdapter(provider: PaymentProvider): PaymentProviderAdapter {
  switch (provider) {
    case "MERCADO_PAGO":
      return new MercadoPagoProvider();
    case "STRIPE":
      return new StripeProvider();
    case "PAGARME":
      return new PagarmeProvider();
    default:
      return new MercadoPagoProvider();
  }
}

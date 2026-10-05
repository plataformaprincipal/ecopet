import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { checkoutTestAmount, checkoutTestPublicOrder, testStatus } from "./checkout-test-isolation";
import {
  createTestMercadoPagoOrder,
  getTestMercadoPagoOrder,
} from "@/lib/mercado-pago/test-client";
import {
  isCheckoutTestOrderNotes,
  isMercadoPagoTestCheckoutConfigured,
} from "@/lib/mercado-pago/test-credentials";
import { mapMpOrderStatusToInternal } from "@/lib/mercado-pago/status";
import { applyCheckoutTestPaymentStatus } from "./apply-checkout-test-status";
import type { CreateMpOrderRequest } from "@/lib/mercado-pago/types";

export type CreateCheckoutTestOrderInput = {
  userId: string;
  orderId: string;
  paymentMethodId: string;
  paymentMethodType?: string;
  cardToken?: string;
  installments?: number;
  payerEmail: string;
  payerFirstName?: string;
  payerLastName?: string;
  identificationType?: string;
  identificationNumber?: string;
};

function formatAmount(value: number): string {
  return value.toFixed(2);
}

function sanitizeMpOrderForClient(mp: {
  id: string;
  status?: string;
  status_detail?: string;
  transactions?: {
    payments?: Array<{
      id?: string;
      status?: string;
      status_detail?: string;
      payment_method?: {
        ticket_url?: string;
        qr_code?: string;
        qr_code_base64?: string;
        id?: string;
        type?: string;
      };
    }>;
  };
}) {
  const pay = mp.transactions?.payments?.[0];
  return {
    id: mp.id,
    status: mp.status ?? null,
    statusDetail: mp.status_detail ?? null,
    paymentId: pay?.id ?? null,
    paymentStatus: pay?.status ?? null,
    ticketUrl: pay?.payment_method?.ticket_url ?? null,
    qrCode: pay?.payment_method?.qr_code ?? null,
    qrCodeBase64: pay?.payment_method?.qr_code_base64 ?? null,
    methodId: pay?.payment_method?.id ?? null,
    methodType: pay?.payment_method?.type ?? null,
  };
}

function isTestPayment(payment: { environment: string; metadata: Prisma.JsonValue | null }): boolean {
  if (payment.environment !== "test") return false;
  const meta = (payment.metadata as Record<string, unknown> | null) ?? {};
  return meta.checkoutTest === true;
}

/**
 * Cria order na API Orders do Mercado Pago TEST para um pedido EcoPet
 * marcado como checkout-test. Sem split, sem credenciais LIVE.
 */
export async function createMercadoPagoCheckoutTestOrder(input: CreateCheckoutTestOrderInput) {
  if (!isMercadoPagoTestCheckoutConfigured()) {
    throw new Error("MP_TEST_NOT_CONFIGURED");
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.userId !== input.userId) throw new Error("ORDER_FORBIDDEN");
  if (!isCheckoutTestOrderNotes(order.deliveryNotes)) throw new Error("ORDER_NOT_TEST");
  if (order.status === "PAID" || order.status === "CANCELLED" || order.status === "REFUNDED") {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  const existingApproved = order.payments.find((p) => testStatus(p.status) === "APPROVED");
  if (existingApproved) throw new Error("ALREADY_PAID");

  const openAttempt = order.payments.find((p) => isTestPayment(p) && p.provider === "mercado_pago" && p.idempotencyKey);
  const amount = checkoutTestAmount(order);
  if (!amount) throw new Error("ORDER_NOT_TEST");

  const methodId = input.paymentMethodId.toLowerCase();
  const isCard = Boolean(input.cardToken);
  if (isCard && (!input.cardToken || input.cardToken.length < 32)) {
    throw new Error("INVALID_CARD_TOKEN");
  }
  if ((methodId === "pix" || methodId === "boleto") && !input.payerEmail) {
    throw new Error("PAYER_EMAIL_REQUIRED");
  }

  const externalReference = `ecopet_test_${order.id}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 150);
  const idempotencyKey = createHash("sha256").update(`checkout-test:${order.id}`).digest("hex");
  const requestFingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");

  let payment =
    openAttempt ||
    (await prisma.payment.upsert({
      where: { idempotencyKey }, update: {},
      create: {
        orderId: order.id,
        userId: order.userId,
        partnerId: null,
        provider: "mercado_pago",
        environment: "test",
        amount: 0,
        currency: "BRL",
        status: "TEST_CREATED",
        idempotencyKey,
        externalReference,
        paymentMethod: methodId,
        paymentType: input.paymentMethodType ?? (isCard ? "credit_card" : methodId),
        installments: isCard ? input.installments ?? 1 : 1,
        metadata: {
          checkoutTest: true,
          isolated: true,
          testAmount: amount,
          requestFingerprint,
          mpProduct: "orders_api_test",
        },
      },
    }));

  const meta = payment.metadata as Record<string, unknown> | null;
  if (meta?.requestFingerprint !== requestFingerprint) throw new Error("IDEMPOTENCY_CONFLICT");
  if (payment.providerOrderId) {
    const existing = await getTestMercadoPagoOrder(payment.providerOrderId);
    if (existing.ok) {
      const internal = mapMpOrderStatusToInternal(existing.data.status, existing.data.status_detail);
      await applyCheckoutTestPaymentStatus({
        paymentId: payment.id,
        internalStatus: internal,
        statusDetail: existing.data.status_detail,
        providerOrderId: existing.data.id,
        providerPaymentId: existing.data.transactions?.payments?.[0]?.id ?? null,
        source: "poll",
      });
      return {
        paymentId: payment.id,
        providerOrderId: existing.data.id,
        status: internal,
        statusDetail: existing.data.status_detail ?? null,
        mpOrder: sanitizeMpOrderForClient(existing.data),
      };
    }
  }

  const paymentMethod: CreateMpOrderRequest["transactions"]["payments"][0]["payment_method"] = {
    id: methodId,
  };
  if (isCard && input.cardToken) {
    paymentMethod.token = input.cardToken;
    paymentMethod.installments = input.installments && input.installments > 0 ? input.installments : 1;
    paymentMethod.type = input.paymentMethodType === "debit_card" ? "debit_card" : "credit_card";
  } else if (methodId === "pix") {
    paymentMethod.type = "bank_transfer";
  } else if (methodId === "boleto") {
    paymentMethod.type = "ticket";
  }

  const body: CreateMpOrderRequest = {
    type: "online",
    processing_mode: "automatic",
    external_reference: externalReference,
    total_amount: formatAmount(amount),
    description: `EcoPet TESTE pedido #${order.orderNumber}`,
    payer: {
      email: input.payerEmail,
      ...(input.payerFirstName ? { first_name: input.payerFirstName } : {}),
      ...(input.payerLastName ? { last_name: input.payerLastName } : {}),
      ...(input.identificationType && input.identificationNumber
        ? {
            identification: {
              type: input.identificationType,
              number: input.identificationNumber,
            },
          }
        : {}),
    },
    transactions: {
      payments: [
        {
          amount: formatAmount(amount),
          payment_method: paymentMethod,
          ...(methodId === "pix" ? { expiration_time: "P1D" } : {}),
        },
      ],
    },
  };

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      orderId: order.id,
      provider: "mercado_pago",
      eventType: "create_test_order_request",
      status: "CREATED",
      message: "Enviando order TEST à API Orders (sem LIVE)",
    },
  });

  const result = await createTestMercadoPagoOrder(body, idempotencyKey);

  if (!result.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "TEST_ERROR", statusDetail: result.code },
    });
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        orderId: order.id,
        provider: "mercado_pago",
        eventType: "create_test_order_error",
        status: "ERROR",
        errorCode: result.code,
        message: result.message,
      },
    });
    throw new Error(result.code);
  }

  const mp = result.data;
  const mapped = mapMpOrderStatusToInternal(mp.status, mp.status_detail);
  const providerPaymentId = mp.transactions?.payments?.[0]?.id ?? null;
  const persistedStatus = mapped;

  payment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: `TEST_${persistedStatus}`,
      statusDetail: mp.status_detail ?? null,
      providerOrderId: mp.id,
      externalId: mp.id,
      providerPaymentId,
      paymentMethod: methodId,
      environment: "test",
      metadata: {
        ...((payment.metadata as Record<string, unknown> | null) ?? {}),
        checkoutTest: true,
        mercadoPagoOrderId: mp.id,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      orderId: order.id,
      provider: "mercado_pago",
      eventType: "create_test_order_response",
      status: persistedStatus,
      message: `MP TEST create mapped=${mapped}; providerOrderId=${mp.id}`,
    },
  });

  if (mapped !== "APPROVED") {
    await applyCheckoutTestPaymentStatus({
      paymentId: payment.id,
      internalStatus: mapped,
      statusDetail: mp.status_detail,
      providerOrderId: mp.id,
      providerPaymentId,
      source: "api",
    });
  }

  return {
    paymentId: payment.id,
    providerOrderId: mp.id,
    status: persistedStatus,
    statusDetail: mp.status_detail ?? null,
    mpOrder: sanitizeMpOrderForClient(mp),
  };
}

export async function getMercadoPagoCheckoutTestOrderForUser(params: {
  userId: string;
  paymentId?: string;
  providerOrderId?: string;
  orderId?: string;
}) {
  const payment = await prisma.payment.findFirst({
    where: {
      provider: "mercado_pago",
      environment: "test",
      userId: params.userId,
      ...(params.paymentId ? { id: params.paymentId } : {}),
      ...(params.providerOrderId ? { providerOrderId: params.providerOrderId } : {}),
      ...(params.orderId ? { orderId: params.orderId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          total: true,
          status: true,
          deliveryNotes: true,
          pricingSnapshot: true,
        },
      },
    },
  });
  if (!payment || payment.order.userId !== params.userId) throw new Error("ORDER_FORBIDDEN");
  if (!checkoutTestAmount(payment.order)) throw new Error("ORDER_NOT_TEST");

  if (!payment.providerOrderId) {
    return {
      paymentId: payment.id,
      providerOrderId: null,
      status: testStatus(payment.status),
      statusDetail: payment.statusDetail,
      mpOrder: null,
      order: checkoutTestPublicOrder(payment.order),
    };
  }

  const remote = await getTestMercadoPagoOrder(payment.providerOrderId);
  if (remote.ok) {
    const internal = mapMpOrderStatusToInternal(remote.data.status, remote.data.status_detail);
    await applyCheckoutTestPaymentStatus({
      paymentId: payment.id,
      internalStatus: internal,
      statusDetail: remote.data.status_detail,
      providerOrderId: remote.data.id,
      providerPaymentId: remote.data.transactions?.payments?.[0]?.id ?? null,
      source: "poll",
    });
    return {
      paymentId: payment.id,
      providerOrderId: remote.data.id,
      status: internal,
      statusDetail: remote.data.status_detail ?? null,
      mpOrder: sanitizeMpOrderForClient(remote.data),
      order: checkoutTestPublicOrder(payment.order),
    };
  }

  return {
    paymentId: payment.id,
    providerOrderId: payment.providerOrderId,
    status: testStatus(payment.status),
    statusDetail: payment.statusDetail,
    mpOrder: null,
    order: checkoutTestPublicOrder(payment.order),
  };
}

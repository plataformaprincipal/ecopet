import "server-only";

import { prisma } from "@/lib/prisma";
import {
  createMercadoPagoOrder,
  getMercadoPagoOrder,
  newIdempotencyKey,
} from "@/lib/mercado-pago/client";
import { getMercadoPagoEnvironment, isMercadoPagoConfigured } from "@/lib/mercado-pago/config";
import { mapMpOrderStatusToInternal } from "@/lib/mercado-pago/status";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import type { CreateMpOrderRequest } from "@/lib/mercado-pago/types";

export type CreateCheckoutOrderInput = {
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

/**
 * Cria order na API Orders do Mercado Pago para um pedido EcoPet existente.
 * Recalcula total no servidor; nunca confia no valor do cliente.
 */
export async function createMercadoPagoCheckoutOrder(input: CreateCheckoutOrderInput) {
  if (!isMercadoPagoConfigured()) {
    throw new Error("MP_NOT_CONFIGURED");
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.userId !== input.userId) throw new Error("ORDER_FORBIDDEN");
  if (order.status === "PAID" || order.status === "CANCELLED" || order.status === "REFUNDED") {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  const existingApproved = order.payments.find((p) => p.status === "APPROVED");
  if (existingApproved) throw new Error("ALREADY_PAID");

  // Idempotência: reutilizar tentativa PENDING com mesma chave ainda aberta
  const openAttempt = order.payments.find(
    (p) =>
      p.provider === "mercado_pago" &&
      (p.status === "PENDING" || p.status === "CREATED" || p.status === "PROCESSING" || p.status === "ACTION_REQUIRED") &&
      p.idempotencyKey
  );

  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("INVALID_AMOUNT");

  const methodId = input.paymentMethodId.toLowerCase();
  const isCard = Boolean(input.cardToken);
  if (isCard && (!input.cardToken || input.cardToken.length < 32)) {
    throw new Error("INVALID_CARD_TOKEN");
  }
  if ((methodId === "pix" || methodId === "boleto") && !input.payerEmail) {
    throw new Error("PAYER_EMAIL_REQUIRED");
  }

  const externalReference = `ecopet_${order.id}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 150);
  const idempotencyKey = openAttempt?.idempotencyKey || newIdempotencyKey();
  const environment = getMercadoPagoEnvironment();

  let payment =
    openAttempt ||
    (await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        partnerId: order.partnerId,
        provider: "mercado_pago",
        environment,
        amount,
        currency: "BRL",
        status: "CREATED",
        idempotencyKey,
        externalReference,
        paymentMethod: methodId,
        paymentType: input.paymentMethodType ?? (isCard ? "credit_card" : methodId),
        installments: isCard ? input.installments ?? 1 : 1,
        metadata: {
          platformFeeEstimated: null,
          partnerNetEstimated: amount,
          splitReady: false,
          items: order.items.map((i) => ({
            partnerId: i.partnerId,
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            gross: i.price * i.quantity,
          })),
        },
      },
    }));

  if (openAttempt?.providerOrderId) {
    const existing = await getMercadoPagoOrder(openAttempt.providerOrderId);
    if (existing.ok) {
      const internal = mapMpOrderStatusToInternal(existing.data.status, existing.data.status_detail);
      await applyInternalPaymentStatus({
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
    description: `EcoPet pedido #${order.orderNumber}`,
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
      eventType: "create_order_request",
      status: "CREATED",
      message: "Enviando order à API Orders",
    },
  });

  const result = await createMercadoPagoOrder(body, idempotencyKey);

  if (!result.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "ERROR", statusDetail: result.code },
    });
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        orderId: order.id,
        provider: "mercado_pago",
        eventType: "create_order_error",
        status: "ERROR",
        errorCode: result.code,
        message: result.message,
      },
    });
    throw new Error(result.code);
  }

  const mp = result.data;
  const internal = mapMpOrderStatusToInternal(mp.status, mp.status_detail);
  const providerPaymentId = mp.transactions?.payments?.[0]?.id ?? null;

  payment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: internal,
      statusDetail: mp.status_detail ?? null,
      providerOrderId: mp.id,
      externalId: mp.id,
      providerPaymentId,
      paymentMethod: methodId,
    },
  });

  await applyInternalPaymentStatus({
    paymentId: payment.id,
    internalStatus: internal,
    statusDetail: mp.status_detail,
    providerOrderId: mp.id,
    providerPaymentId,
    source: "api",
  });

  return {
    paymentId: payment.id,
    providerOrderId: mp.id,
    status: internal,
    statusDetail: mp.status_detail ?? null,
    mpOrder: sanitizeMpOrderForClient(mp),
  };
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

export async function getMercadoPagoCheckoutOrderForUser(params: {
  userId: string;
  paymentId?: string;
  providerOrderId?: string;
}) {
  const payment = await prisma.payment.findFirst({
    where: {
      provider: "mercado_pago",
      userId: params.userId,
      ...(params.paymentId ? { id: params.paymentId } : {}),
      ...(params.providerOrderId ? { providerOrderId: params.providerOrderId } : {}),
    },
    include: { order: { select: { id: true, orderNumber: true, userId: true, total: true, status: true } } },
  });
  if (!payment || payment.order.userId !== params.userId) throw new Error("ORDER_FORBIDDEN");
  if (!payment.providerOrderId) {
    return {
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
      mpOrder: null,
    };
  }

  const remote = await getMercadoPagoOrder(payment.providerOrderId);
  if (remote.ok) {
    const internal = mapMpOrderStatusToInternal(remote.data.status, remote.data.status_detail);
    await applyInternalPaymentStatus({
      paymentId: payment.id,
      internalStatus: internal,
      statusDetail: remote.data.status_detail,
      providerOrderId: remote.data.id,
      providerPaymentId: remote.data.transactions?.payments?.[0]?.id ?? null,
      source: "poll",
    });
    return {
      paymentId: payment.id,
      status: internal,
      statusDetail: remote.data.status_detail ?? null,
      mpOrder: sanitizeMpOrderForClient(remote.data),
      order: payment.order,
    };
  }

  return {
    paymentId: payment.id,
    status: payment.status,
    statusDetail: payment.statusDetail,
    mpOrder: null,
    order: payment.order,
  };
}

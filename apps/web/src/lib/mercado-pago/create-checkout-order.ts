import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createMercadoPagoOrder,
  getMercadoPagoLegacyPayment,
  getMercadoPagoOrder,
  newIdempotencyKey,
} from "@/lib/mercado-pago/client";
import {
  getMercadoPagoEnvironment,
  isMercadoPagoCheckoutAvailable,
} from "@/lib/mercado-pago/config";
import {
  mapMpLegacyPaymentStatusToInternal,
  mapMpOrderStatusToInternal,
} from "@/lib/mercado-pago/status";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import type { CreateMpOrderRequest } from "@/lib/mercado-pago/types";
import { metricsFromOrderRow } from "@/lib/finance/metrics";
import { validateOnlinePaymentMethod } from "@/lib/mercado-pago/payment-policy";
import {
  createSplitMarketplacePayment,
  resolveOrderMarketplaceSplit,
  sanitizeMarketplacePaymentForClient,
} from "@/lib/mercado-pago/marketplace-split";

export type CreateCheckoutOrderInput = {
  userId: string;
  orderId: string;
  paymentMethodId: string;
  paymentMethodType?: string;
  cardToken?: string;
  installments?: 1;
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
export async function createMercadoPagoCheckoutOrder(
  input: CreateCheckoutOrderInput,
) {
  if (!isMercadoPagoCheckoutAvailable()) {
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
  if (
    order.status === "PAID" ||
    order.status === "CANCELLED" ||
    order.status === "REFUNDED"
  ) {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  const existingApproved = order.payments.find((p) => p.status === "APPROVED");
  if (existingApproved) throw new Error("ALREADY_PAID");

  // Idempotência: reutilizar tentativa PENDING com mesma chave ainda aberta
  const openAttempt = order.payments.find(
    (p) =>
      p.provider === "mercado_pago" &&
      (p.status === "PENDING" ||
        p.status === "CREATED" ||
        p.status === "PROCESSING" ||
        p.status === "ACTION_REQUIRED") &&
      p.idempotencyKey,
  );

  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("INVALID_AMOUNT");
  const snapshotMetrics = metricsFromOrderRow(order);
  const splitEval = await resolveOrderMarketplaceSplit({
    partnerId: order.partnerId,
    itemPartnerIds: order.items.map((i) => i.partnerId),
    amount,
    applicationFeeAmount: snapshotMetrics.platformRevenue,
  });
  const split = splitEval.capability;
  // Marketplace orders must be collected by the connected seller. Never fall back to EcoPet's collector.
  if (splitEval.partnerId && !split.splitReady) {
    throw new Error("MARKETPLACE_SELLER_NOT_CONNECTED");
  }

  const methodId = input.paymentMethodId.toLowerCase();
  const isCard = Boolean(input.cardToken);
  const policyError = validateOnlinePaymentMethod(input);
  if (policyError) throw new Error(policyError);
  if (isCard && (!input.cardToken || input.cardToken.length < 32)) {
    throw new Error("INVALID_CARD_TOKEN");
  }
  if ((methodId === "pix" || methodId === "boleto") && !input.payerEmail) {
    throw new Error("PAYER_EMAIL_REQUIRED");
  }

  const externalReference = `ecopet_${order.id}`
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 150);
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
        paymentType:
          input.paymentMethodType ?? (isCard ? "credit_card" : methodId),
        installments: 1,
        metadata: {
          platformFeeEstimated: snapshotMetrics.platformRevenue,
          partnerNetEstimated: snapshotMetrics.estimatedPayout,
          riskReserveEstimate: snapshotMetrics.reserveAmount,
          pricingVersion: order.pricingVersion,
          splitReady: split.splitReady,
          logicalSplitOnly: !split.splitReady,
          splitDecision: split.decision,
          mpProduct: split.mpProduct,
          collectorId: split.collectorId,
          applicationFee: split.splitReady
            ? snapshotMetrics.platformRevenue
            : 0,
          topology: split.topology,
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
      const internal = mapMpOrderStatusToInternal(
        existing.data.status,
        existing.data.status_detail,
      );
      await applyInternalPaymentStatus({
        paymentId: payment.id,
        internalStatus: internal,
        statusDetail: existing.data.status_detail,
        providerOrderId: existing.data.id,
        providerPaymentId:
          existing.data.transactions?.payments?.[0]?.id ?? null,
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

  if (openAttempt?.providerPaymentId && !openAttempt.providerOrderId) {
    const existingPay = await getMercadoPagoLegacyPayment(
      openAttempt.providerPaymentId,
    );
    if (existingPay.ok) {
      const internal = mapMpLegacyPaymentStatusToInternal(
        typeof existingPay.data.status === "string"
          ? existingPay.data.status
          : undefined,
        typeof existingPay.data.status_detail === "string"
          ? existingPay.data.status_detail
          : undefined,
      );
      await applyInternalPaymentStatus({
        paymentId: payment.id,
        internalStatus: internal,
        statusDetail:
          typeof existingPay.data.status_detail === "string"
            ? existingPay.data.status_detail
            : null,
        providerPaymentId: String(
          existingPay.data.id ?? openAttempt.providerPaymentId,
        ),
        source: "poll",
      });
      return {
        paymentId: payment.id,
        providerOrderId: null,
        status: internal,
        statusDetail:
          typeof existingPay.data.status_detail === "string"
            ? existingPay.data.status_detail
            : null,
        mpOrder: sanitizeMarketplacePaymentForClient(existingPay.data),
      };
    }
  }

  if (split.splitReady && splitEval.partnerId) {
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        orderId: order.id,
        provider: "mercado_pago",
        eventType: "create_marketplace_payment_request",
        status: "CREATED",
        message:
          "Enviando pagamento marketplace (application_fee + collector do seller)",
      },
    });
    const splitResult = await createSplitMarketplacePayment({
      partnerId: splitEval.partnerId,
      amount,
      applicationFee: snapshotMetrics.platformRevenue,
      idempotencyKey,
      externalReference,
      description: `EcoPet pedido #${order.orderNumber}`,
      paymentMethodId: methodId,
      cardToken: input.cardToken,
      installments: 1,
      payerEmail: input.payerEmail,
      payerFirstName: input.payerFirstName,
      payerLastName: input.payerLastName,
      identificationType: input.identificationType,
      identificationNumber: input.identificationNumber,
    });
    if (!splitResult.ok) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "ERROR", statusDetail: splitResult.code },
      });
      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          orderId: order.id,
          provider: "mercado_pago",
          eventType: "create_marketplace_payment_error",
          status: "ERROR",
          errorCode: splitResult.code,
          message: splitResult.message,
        },
      });
      throw new Error(splitResult.code);
    }
    const mapped = splitResult.mappedStatus;
    const persistedStatus = mapped === "APPROVED" ? "PROCESSING" : mapped;
    const providerPaymentId =
      splitResult.data.id != null ? String(splitResult.data.id) : null;
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: persistedStatus,
        statusDetail:
          typeof splitResult.data.status_detail === "string"
            ? splitResult.data.status_detail
            : null,
        providerPaymentId,
        externalId: providerPaymentId,
        paymentMethod: methodId,
        metadata: {
          ...((payment.metadata as Record<string, unknown> | null) ?? {}),
          splitReady: true,
          logicalSplitOnly: false,
          mpProduct: "payments_api_marketplace",
          collectorId: splitResult.collectorId,
          applicationFee: splitResult.applicationFee,
        } as Prisma.InputJsonValue,
      },
    });
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        orderId: order.id,
        provider: "mercado_pago",
        eventType: "create_marketplace_payment_response",
        status: persistedStatus,
        message: `MP marketplace mapped=${mapped}; persisted=${persistedStatus} (PAID apenas via webhook/poll)`,
      },
    });
    if (mapped !== "APPROVED") {
      await applyInternalPaymentStatus({
        paymentId: payment.id,
        internalStatus: mapped,
        statusDetail:
          typeof splitResult.data.status_detail === "string"
            ? splitResult.data.status_detail
            : null,
        providerPaymentId,
        source: "api",
      });
    }
    return {
      paymentId: payment.id,
      providerOrderId: null,
      status: persistedStatus,
      statusDetail:
        typeof splitResult.data.status_detail === "string"
          ? splitResult.data.status_detail
          : null,
      mpOrder: sanitizeMarketplacePaymentForClient(splitResult.data),
    };
  }

  const paymentMethod: CreateMpOrderRequest["transactions"]["payments"][0]["payment_method"] =
    {
      id: methodId,
    };
  if (isCard && input.cardToken) {
    paymentMethod.token = input.cardToken;
    paymentMethod.installments = 1;
    paymentMethod.type = "credit_card";
  } else if (methodId === "pix") {
    paymentMethod.type = "bank_transfer";
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
  const mapped = mapMpOrderStatusToInternal(mp.status, mp.status_detail);
  const providerPaymentId = mp.transactions?.payments?.[0]?.id ?? null;

  // Fase 2: create/API NÃO confirma PAID — persiste IDs e aguarda webhook/poll.
  // Status APPROVED do create response vira PROCESSING até confirmação assíncrona.
  const persistedStatus = mapped === "APPROVED" ? "PROCESSING" : mapped;

  payment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: persistedStatus,
      statusDetail: mp.status_detail ?? null,
      providerOrderId: mp.id,
      externalId: mp.id,
      providerPaymentId,
      paymentMethod: methodId,
    },
  });

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      orderId: order.id,
      provider: "mercado_pago",
      eventType: "create_order_response",
      status: persistedStatus,
      message: `MP create mapped=${mapped}; persisted=${persistedStatus} (PAID apenas via webhook/poll)`,
    },
  });

  // Falhas/pendências do create atualizam Payment; APPROVED só via webhook/poll.
  if (mapped !== "APPROVED") {
    await applyInternalPaymentStatus({
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
  orderId?: string;
}) {
  const payment = await prisma.payment.findFirst({
    where: {
      provider: "mercado_pago",
      userId: params.userId,
      ...(params.paymentId ? { id: params.paymentId } : {}),
      ...(params.providerOrderId
        ? { providerOrderId: params.providerOrderId }
        : {}),
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
        },
      },
    },
  });
  if (!payment || payment.order.userId !== params.userId)
    throw new Error("ORDER_FORBIDDEN");
  if (!payment.providerOrderId && payment.providerPaymentId) {
    const remotePay = await getMercadoPagoLegacyPayment(
      payment.providerPaymentId,
    );
    if (remotePay.ok) {
      const internal = mapMpLegacyPaymentStatusToInternal(
        typeof remotePay.data.status === "string"
          ? remotePay.data.status
          : undefined,
        typeof remotePay.data.status_detail === "string"
          ? remotePay.data.status_detail
          : undefined,
      );
      await applyInternalPaymentStatus({
        paymentId: payment.id,
        internalStatus: internal,
        statusDetail:
          typeof remotePay.data.status_detail === "string"
            ? remotePay.data.status_detail
            : null,
        providerPaymentId: String(
          remotePay.data.id ?? payment.providerPaymentId,
        ),
        source: "poll",
      });
      return {
        paymentId: payment.id,
        status: internal,
        statusDetail:
          typeof remotePay.data.status_detail === "string"
            ? remotePay.data.status_detail
            : null,
        mpOrder: sanitizeMarketplacePaymentForClient(remotePay.data),
        order: payment.order,
      };
    }
  }
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
    const internal = mapMpOrderStatusToInternal(
      remote.data.status,
      remote.data.status_detail,
    );
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

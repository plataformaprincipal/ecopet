import "server-only";

import { prisma } from "@/lib/prisma";
import { createInternalNotification } from "@/lib/notifications/internal";
import { writeAuditLog } from "@/lib/audit-log";
import { findPaymentByMpIds } from "@/lib/mercado-pago/webhooks/link-payment";
import { refundMercadoPagoLegacyPayment } from "@/lib/mercado-pago/client";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import type { MpWebhookHandler } from "@/lib/mercado-pago/webhooks/handler-types";
import { UserRole } from "@prisma/client";

/**
 * Topic oficial: stop_delivery_op_wh
 * Docs: cancelar/reembolsar sem entregar. Resposta 200 obrigatória (sem retry MP).
 */
export const handleFraudAlertWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const data = normalized.parsed.data;
  const paymentProviderId =
    data.payment_id != null ? String(data.payment_id) : normalized.parsed.resourceId;
  const merchantOrderId = data.merchant_order != null ? String(data.merchant_order) : null;

  const payment = await findPaymentByMpIds({
    providerPaymentId: paymentProviderId,
    merchantOrderId,
  });

  const alert = await prisma.mpFraudAlert.create({
    data: {
      providerAlertId: normalized.parsed.providerEventId,
      paymentProviderId,
      merchantOrderId,
      siteId: data.site_id != null ? String(data.site_id) : null,
      description:
        typeof data.description === "string" ? data.description.slice(0, 500) : "Alerta de fraude MP",
      status: "PENDING_REVIEW",
      orderId: payment?.orderId ?? null,
      paymentId: payment?.id ?? null,
      partnerId: payment?.partnerId ?? null,
      userId: payment?.userId ?? null,
      webhookEventId: event.id,
      metadata: { live_mode: normalized.parsed.liveMode },
    },
  });

  if (payment) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { fulfillmentBlocked: true, fraudHold: true },
    });
    await prisma.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status: payment.order.status,
        note: `Alerta de fraude Mercado Pago — expedição bloqueada (alert ${alert.id})`,
      },
    });

    // Reembolso via Payments API quando há providerPaymentId (docs oficiais).
    // Em falha: mantém PENDING_REVIEW para ação admin — não inventa Orders refund.
    if (payment.providerPaymentId || paymentProviderId) {
      const refundId = payment.providerPaymentId || paymentProviderId!;
      const refund = await refundMercadoPagoLegacyPayment(
        refundId,
        `fraud-refund-${alert.id}`
      );
      if (refund.ok) {
        await applyInternalPaymentStatus({
          paymentId: payment.id,
          internalStatus: "REFUNDED",
          statusDetail: "fraud_stop_delivery",
          source: "webhook",
        });
        await prisma.mpFraudAlert.update({
          where: { id: alert.id },
          data: { status: "REFUNDED", resolvedAt: new Date() },
        });
      }
    }

    if (payment.partnerId) {
      void createInternalNotification({
        userId: payment.partnerId,
        title: "Alerta de fraude — pedido bloqueado",
        body: `Pedido #${payment.order.orderNumber} bloqueado para expedição por alerta Mercado Pago.`,
        type: "SECURITY",
        actionUrl: `/dashboard/partner/orders/${payment.orderId}`,
        data: { orderId: payment.orderId, fraudAlertId: alert.id },
      });
    }

    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, accountStatus: "ACTIVE" },
      select: { id: true },
      take: 20,
    });
    for (const admin of admins) {
      void createInternalNotification({
        userId: admin.id,
        title: "Fraude MP — revisão necessária",
        body: `Alerta ${alert.id} no pedido #${payment.order.orderNumber}.`,
        type: "SECURITY",
        actionUrl: `/admin/mercado-pago/fraudes`,
        data: { fraudAlertId: alert.id },
      });
    }
  }

  void writeAuditLog({
    action: "CREATE",
    module: "payments.mercado_pago.fraud",
    resource: "MpFraudAlert",
    resourceId: alert.id,
    observation: "Alerta de fraude webhook processado",
  });

  return {
    processingStatus: "PROCESSED",
    orderId: payment?.orderId ?? null,
    paymentId: payment?.id ?? null,
    partnerId: payment?.partnerId ?? null,
    userId: payment?.userId ?? null,
  };
};

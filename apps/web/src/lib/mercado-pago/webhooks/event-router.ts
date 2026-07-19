import type { MpPanelTopicKey } from "@/lib/mercado-pago/webhooks/event-types";
import type { MpWebhookHandler } from "@/lib/mercado-pago/webhooks/handler-types";
import { handleOrderWebhook } from "@/lib/mercado-pago/webhooks/handlers/order";
import { handleFraudAlertWebhook } from "@/lib/mercado-pago/webhooks/handlers/fraud-alert";
import { handleLegacyPaymentWebhook } from "@/lib/mercado-pago/webhooks/handlers/legacy-payment";
import { handleClaimWebhook } from "@/lib/mercado-pago/webhooks/handlers/claim";
import { handleDisputeWebhook } from "@/lib/mercado-pago/webhooks/handlers/dispute";
import {
  handleApplicationLinkWebhook,
  handleCardUpdaterWebhook,
  handleCommercialOrderWebhook,
  handleDeliveryWebhook,
  handlePayerProfileWebhook,
  handlePointWebhook,
  handleSelfServiceWebhook,
  handleShipmentWebhook,
  handleSubscriptionWebhook,
  handleUnknownWebhook,
  handleWalletConnectWebhook,
} from "@/lib/mercado-pago/webhooks/handlers/structural";

const HANDLERS: Record<MpPanelTopicKey, MpWebhookHandler> = {
  order: handleOrderWebhook,
  payment: handleLegacyPaymentWebhook,
  fraud_alert: handleFraudAlertWebhook,
  card_updater: handleCardUpdaterWebhook,
  shipment: handleShipmentWebhook,
  application_link: handleApplicationLinkWebhook,
  claim: handleClaimWebhook,
  dispute: handleDisputeWebhook,
  payer_profile: handlePayerProfileWebhook,
  subscription: handleSubscriptionWebhook,
  delivery: handleDeliveryWebhook,
  commercial_order: handleCommercialOrderWebhook,
  point: handlePointWebhook,
  wallet_connect: handleWalletConnectWebhook,
  self_service: handleSelfServiceWebhook,
  unknown: handleUnknownWebhook,
};

export function getWebhookHandler(panelKey: MpPanelTopicKey): MpWebhookHandler {
  return HANDLERS[panelKey] ?? handleUnknownWebhook;
}

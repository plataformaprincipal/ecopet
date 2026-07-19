import type { MpWebhookEvent } from "@prisma/client";
import type { NormalizedMpWebhook } from "@/lib/mercado-pago/webhooks/normalize-event";

export type HandlerResult = {
  processingStatus:
    | "PROCESSED"
    | "IGNORED"
    | "UNSUPPORTED"
    | "NOT_APPLICABLE"
    | "FAILED"
    | "RETRY_PENDING";
  failureCode?: string;
  failureReason?: string;
  orderId?: string | null;
  paymentId?: string | null;
  partnerId?: string | null;
  userId?: string | null;
  retryable?: boolean;
};

export type MpWebhookHandlerContext = {
  event: MpWebhookEvent;
  normalized: NormalizedMpWebhook;
};

export type MpWebhookHandler = (ctx: MpWebhookHandlerContext) => Promise<HandlerResult>;

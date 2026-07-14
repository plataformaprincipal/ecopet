import { getVapidConfig, isPushConfigured } from "@/lib/push/vapid";

export type PushSendPayload = {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
};

export type PushSendResult = {
  delivered: boolean;
  skipped?: boolean;
  code:
    | "DELIVERED"
    | "SKIPPED_NOT_CONFIGURED"
    | "NOT_CONFIGURED"
    | "PUSH_SEND_FAILED"
    | "PUSH_GONE";
  reason?: string;
};

type WebPushLike = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    options?: { TTL?: number }
  ) => Promise<unknown>;
};

async function loadWebPush(): Promise<WebPushLike | null> {
  try {
    const mod = await import("web-push");
    return (mod.default ?? mod) as WebPushLike;
  } catch {
    return null;
  }
}

/**
 * Send a Web Push notification to a single subscription.
 * Never reports delivered:true without a real successful send.
 */
export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushSendPayload
): Promise<PushSendResult> {
  if (!isPushConfigured()) {
    return {
      delivered: false,
      skipped: true,
      code: "SKIPPED_NOT_CONFIGURED",
      reason: "SKIPPED_NOT_CONFIGURED: VAPID ausente — push não enviado",
    };
  }

  const webpush = await loadWebPush();
  if (!webpush) {
    return {
      delivered: false,
      skipped: true,
      code: "NOT_CONFIGURED",
      reason: "NOT_CONFIGURED: pacote web-push ausente — push não enviado",
    };
  }

  const vapid = getVapidConfig();
  if (!vapid) {
    return {
      delivered: false,
      skipped: true,
      code: "SKIPPED_NOT_CONFIGURED",
      reason: "SKIPPED_NOT_CONFIGURED: VAPID ausente — push não enviado",
    };
  }

  try {
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url,
        data: payload.data ?? {},
      }),
      { TTL: 60 * 60 }
    );
    return { delivered: true, code: "DELIVERED" };
  } catch (err) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? Number((err as { statusCode?: number }).statusCode)
        : undefined;
    if (statusCode === 404 || statusCode === 410) {
      return {
        delivered: false,
        code: "PUSH_GONE",
        reason: `PUSH_GONE: subscription invalid (${statusCode})`,
      };
    }
    const message = err instanceof Error ? err.message.slice(0, 200) : "PUSH_SEND_FAILED";
    return {
      delivered: false,
      code: "PUSH_SEND_FAILED",
      reason: message,
    };
  }
}

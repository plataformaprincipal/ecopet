import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { listActive } from "@/lib/push/push-service";
import { isPushConfigured } from "@/lib/push/vapid";
import { sendWebPush } from "@/lib/push/web-push-sender";

/**
 * ADMIN-only smoke test. Never reports success when VAPID/web-push is missing.
 */
export async function POST(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/push/test" });
  if (error) return error;

  if (!isPushConfigured()) {
    return apiSuccess({
      delivered: false,
      skipped: true,
      code: "NOT_CONFIGURED",
      reason: "NOT_CONFIGURED: VAPID ausente — push de teste não enviado",
    });
  }

  let targetUserId = user!.id;
  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string };
    if (body.userId?.trim()) targetUserId = body.userId.trim();
  } catch {
    // use admin's own subscriptions
  }

  const subs = await listActive(targetUserId);
  if (subs.length === 0) {
    return apiSuccess({
      delivered: false,
      skipped: true,
      code: "SKIPPED_NO_DESTINATION",
      reason: "SKIPPED_NO_DESTINATION: nenhuma subscription ativa",
    });
  }

  const results = [];
  let anyDelivered = false;
  for (const sub of subs) {
    const outcome = await sendWebPush(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      {
        title: "EcoPet — teste de push",
        body: "Notificação de teste (admin).",
        url: "/notifications",
      }
    );
    results.push({
      subscriptionId: sub.id,
      code: outcome.code,
      delivered: outcome.delivered,
      reason: outcome.reason,
    });
    if (outcome.delivered) anyDelivered = true;
  }

  if (!anyDelivered) {
    const first = results[0];
    return apiSuccess({
      delivered: false,
      skipped: first?.code?.startsWith("SKIPPED") || first?.code === "NOT_CONFIGURED",
      code: first?.code ?? "PUSH_SEND_FAILED",
      reason: first?.reason,
      results,
    });
  }

  return apiSuccess({
    delivered: true,
    code: "DELIVERED",
    results,
  });
}

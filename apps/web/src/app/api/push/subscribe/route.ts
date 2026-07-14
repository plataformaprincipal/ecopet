import { apiFailure, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { revokeSubscription, saveSubscription } from "@/lib/push/push-service";
import { isPushConfigured } from "@/lib/push/vapid";

type SubscribeBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  p256dh?: string;
  auth?: string;
  userAgent?: string;
};

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!isPushConfigured()) {
    return apiFailure(
      "NOT_CONFIGURED",
      "Web Push em preparação / não configurado (VAPID ausente).",
      503
    );
  }

  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return apiValidationError("Body JSON inválido.");
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = (body.keys?.p256dh ?? body.p256dh)?.trim();
  const auth = (body.keys?.auth ?? body.auth)?.trim();

  if (!endpoint || !p256dh || !auth) {
    return apiValidationError("endpoint, p256dh e auth são obrigatórios.");
  }

  const userAgent =
    body.userAgent?.trim() || req.headers.get("user-agent")?.slice(0, 500) || null;

  const row = await saveSubscription({
    userId: user!.id,
    endpoint,
    p256dh,
    auth,
    userAgent,
  });

  return apiSuccess({ id: row.id, endpoint: row.endpoint });
}

export async function DELETE(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let endpoint: string | undefined;
  try {
    const body = (await req.json()) as { endpoint?: string };
    endpoint = body.endpoint?.trim();
  } catch {
    const url = new URL(req.url);
    endpoint = url.searchParams.get("endpoint")?.trim() || undefined;
  }

  if (!endpoint) {
    return apiValidationError("endpoint é obrigatório.");
  }

  const revoked = await revokeSubscription(user!.id, endpoint);
  if (!revoked) {
    return apiFailure("NOT_FOUND", "Subscription não encontrada.", 404);
  }
  return apiSuccess({ revoked: true });
}

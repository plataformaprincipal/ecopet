import { z } from "zod";
import { apiFailure, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseClientReady } from "@/lib/firebase/config";
import { registerPushDevice } from "@/lib/firebase/token-management";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(20).max(4096),
  deviceId: z.string().min(4).max(120).optional(),
  deviceName: z.string().max(120).optional(),
  permissionStatus: z.string().max(40).optional(),
  /** Ignorado — userId vem da sessão. */
  userId: z.string().optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`fcm-register:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Muitas tentativas de registro. Aguarde.", 429);
  }

  if (!isFirebaseClientReady() || !isFirebaseAdminConfigured()) {
    return apiFailure(
      "NOT_CONFIGURED",
      "Firebase Cloud Messaging não está configurado.",
      503
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiValidationError("Body JSON inválido.");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiValidationError("Token ou deviceId inválidos.");
  }

  // userId do body é propositalmente ignorado (anti-IDOR)
  try {
    const row = await registerPushDevice({
      userId: user!.id,
      token: parsed.data.token,
      deviceId: parsed.data.deviceId,
      deviceName: parsed.data.deviceName,
      userAgent: req.headers.get("user-agent"),
      permissionStatus: parsed.data.permissionStatus || "GRANTED",
    });

    // Ativa preferência push ao registrar dispositivo (consentimento explícito via UI)
    await prisma.notificationPreference.upsert({
      where: { userId: user!.id },
      create: { userId: user!.id, pushEnabled: true },
      update: { pushEnabled: true },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user!.id,
          action: "CREATE",
          module: "push-notifications",
          resource: "push-device",
          resourceId: row.id,
          status: "success",
          metadata: {
            platform: row.platform,
            browser: row.browser,
            // nunca incluir token
          },
        },
      });
    } catch {
      /* audit best-effort */
    }

    return apiSuccess({
      registered: true,
      device: {
        id: row.id,
        deviceId: row.deviceId,
        platform: row.platform,
        browser: row.browser,
        active: row.active,
        lastSeenAt: row.lastSeenAt,
      },
    });
  } catch (err) {
    return apiFailure(
      "REGISTER_FAILED",
      err instanceof Error && err.message === "INVALID_TOKEN_LENGTH"
        ? "Token inválido."
        : "Não foi possível registrar o dispositivo.",
      400
    );
  }
}

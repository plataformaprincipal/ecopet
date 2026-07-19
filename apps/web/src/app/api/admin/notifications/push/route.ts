import { UserRole } from "@prisma/client";
import { z } from "zod";
import { apiFailure, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sendPushToUser, sendPushBatch } from "@/lib/firebase/messaging-server";
import { buildFcmPayload } from "@/lib/firebase/notification-builder";
import { sanitizeNotificationUrl } from "@/lib/firebase/safe-url";
import { revealDeviceToken } from "@/lib/firebase/token-management";
import type { PushCategory } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";

const testSchema = z.object({
  action: z.literal("test"),
  deviceId: z.string().min(4).max(120),
  title: z.string().min(1).max(80).optional(),
  body: z.string().min(1).max(180).optional(),
});

const broadcastSchema = z.object({
  action: z.literal("broadcast"),
  role: z
    .enum(["CLIENT", "PARTNER", "ONG", "ADMIN", "TUTOR", "VETERINARIAN", "CLINIC", "PETSHOP"])
    .optional(),
  category: z
    .enum([
      "orders",
      "payments",
      "deliveries",
      "messages",
      "appointments",
      "social",
      "support",
      "marketing",
      "security",
      "admin",
    ])
    .default("admin"),
  title: z.string().min(3).max(80),
  body: z.string().min(3).max(180),
  url: z.string().max(400).optional(),
  confirm: z.literal(true),
  confirmAll: z.boolean().optional(),
  estimateOnly: z.boolean().optional(),
});

export async function GET() {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const [activeDevices, usersWithPush, recent] = await Promise.all([
    prisma.pushDevice.count({ where: { active: true, provider: "FCM" } }),
    prisma.pushDevice.groupBy({
      by: ["userId"],
      where: { active: true, provider: "FCM" },
    }).then((r) => r.length),
    prisma.pushNotificationDelivery.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        errorCode: true,
        createdAt: true,
        sentAt: true,
        // nunca token
      },
    }),
  ]);

  return apiSuccess({
    configured: isFirebaseAdminConfigured(),
    activeDevices,
    usersWithPush,
    recentDeliveries: recent,
  });
}

export async function POST(req: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  if (!checkRateLimit(`admin-fcm:${user!.id}`, 10, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de envios administrativos.", 429);
  }

  if (!isFirebaseAdminConfigured()) {
    return apiFailure("NOT_CONFIGURED", "Firebase Admin não configurado.", 503);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiValidationError("Body JSON inválido.");
  }

  const asRecord = json as { action?: string };

  if (asRecord.action === "test") {
    const parsed = testSchema.safeParse(json);
    if (!parsed.success) return apiValidationError("deviceId do admin é obrigatório.");

    const device = await prisma.pushDevice.findFirst({
      where: {
        userId: user!.id,
        deviceId: parsed.data.deviceId,
        active: true,
      },
    });

    if (!device) {
      return apiFailure(
        "NO_DEVICE",
        "Ative as notificações push neste navegador antes do teste.",
        400
      );
    }

    const summary = await sendPushToUser({
      userId: user!.id,
      title: parsed.data.title || "EcoPet — teste",
      body: parsed.data.body || "Notificação de teste do painel administrativo.",
      url: "/admin/integracoes/firebase",
      category: "admin",
      onlyDeviceDbId: device.id,
      skipPreferenceCheck: true,
      idempotencyKey: `admin-test:${user!.id}:${device.id}:${Date.now()}`,
    });

    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "CREATE",
        module: "admin-notifications",
        resource: "fcm-test",
        status: summary.sent > 0 ? "success" : "failure",
        metadata: { summary },
      },
    }).catch(() => undefined);

    return apiSuccess({ summary });
  }

  if (asRecord.action === "broadcast") {
    const parsed = broadcastSchema.safeParse(json);
    if (!parsed.success) {
      return apiValidationError("Dados de broadcast inválidos ou confirmação ausente.");
    }

    if (!parsed.data.role && !parsed.data.confirmAll) {
      return apiValidationError(
        "Envio para todos exige confirmAll:true e confirm:true."
      );
    }

    if (parsed.data.category === "marketing") {
      // marketing exige consentimento — filtrado em canSendPushToUser
    }

    const where = {
      active: true as const,
      provider: "FCM" as const,
      ...(parsed.data.role
        ? { user: { role: parsed.data.role as UserRole } }
        : {}),
    };

    const devices = await prisma.pushDevice.findMany({
      where,
      select: {
        id: true,
        userId: true,
        encryptedToken: true,
      },
      take: 2000,
    });

    if (parsed.data.estimateOnly) {
      const uniqueUsers = new Set(devices.map((d) => d.userId)).size;
      return apiSuccess({
        estimate: { devices: devices.length, users: uniqueUsers },
      });
    }

    if (devices.length === 0) {
      return apiSuccess({ summary: { attempted: 0, sent: 0, failed: 0, invalidTokens: 0, skipped: 1, retryPending: 0 } });
    }

    // Envio individual respeitando preferências (incl. marketing)
    if (devices.length <= 50 || parsed.data.role) {
      let summary = {
        attempted: 0,
        sent: 0,
        failed: 0,
        invalidTokens: 0,
        skipped: 0,
        retryPending: 0,
      };
      const uniqueUserIds = [...new Set(devices.map((d) => d.userId))];
      for (const uid of uniqueUserIds) {
        const part = await sendPushToUser({
          userId: uid,
          title: parsed.data.title,
          body: parsed.data.body,
          url: sanitizeNotificationUrl(parsed.data.url || "/notifications"),
          category: parsed.data.category as PushCategory,
          idempotencyKey: `admin-bc:${user!.id}:${parsed.data.category}:${parsed.data.title}:${uid}`,
        });
        summary = {
          attempted: summary.attempted + part.attempted,
          sent: summary.sent + part.sent,
          failed: summary.failed + part.failed,
          invalidTokens: summary.invalidTokens + part.invalidTokens,
          skipped: summary.skipped + part.skipped,
          retryPending: summary.retryPending + part.retryPending,
        };
      }

      await prisma.auditLog.create({
        data: {
          userId: user!.id,
          action: "CREATE",
          module: "admin-notifications",
          resource: "fcm-broadcast",
          status: "success",
          metadata: {
            role: parsed.data.role || "ALL",
            category: parsed.data.category,
            summary,
            // sem tokens / sem body completo se sensível — body já é curto
          },
        },
      }).catch(() => undefined);

      return apiSuccess({ summary });
    }

    // Lote grande — multicast (prefs menos granulares; admin/security only path)
    const payload = buildFcmPayload({
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url,
      category: parsed.data.category as PushCategory,
    });

    const tokens = devices
      .map((d) => {
        try {
          return {
            deviceDbId: d.id,
            userId: d.userId,
            token: revealDeviceToken(d.encryptedToken),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{ deviceDbId: string; userId: string; token: string }>;

    const summary = await sendPushBatch({
      tokens: tokens.slice(0, 500),
      payload,
      idempotencyKeyPrefix: `admin-bc-batch:${user!.id}:${Date.now()}`,
    });

    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "CREATE",
        module: "admin-notifications",
        resource: "fcm-broadcast-batch",
        status: "success",
        metadata: { summary, truncated: tokens.length > 500 },
      },
    }).catch(() => undefined);

    return apiSuccess({ summary, truncated: tokens.length > 500 });
  }

  return apiValidationError("action deve ser test ou broadcast.");
}

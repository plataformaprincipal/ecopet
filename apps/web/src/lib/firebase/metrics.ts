import "server-only";

import { prisma } from "@/lib/prisma";
import { isFirebaseAdminConfigured, getFirebaseAdminSanitizedStatus } from "./admin";
import { isFirebaseClientReady } from "./config";

export async function getFirebasePushMetrics() {
  const [
    activeDevices,
    usersWithPush,
    totalDeliveries,
    sent,
    failed,
    invalidTokens,
    retries,
    lastSent,
    lastFailed,
    errorGroups,
  ] = await Promise.all([
    prisma.pushDevice.count({ where: { active: true, provider: "FCM" } }),
    prisma.pushDevice.groupBy({
      by: ["userId"],
      where: { active: true, provider: "FCM" },
    }).then((rows) => rows.length),
    prisma.pushNotificationDelivery.count(),
    prisma.pushNotificationDelivery.count({ where: { status: "SENT" } }),
    prisma.pushNotificationDelivery.count({ where: { status: "FAILED" } }),
    prisma.pushNotificationDelivery.count({ where: { status: "INVALID_TOKEN" } }),
    prisma.pushNotificationDelivery.count({ where: { status: "RETRY_PENDING" } }),
    prisma.pushNotificationDelivery.findFirst({
      where: { status: "SENT" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true, createdAt: true },
    }),
    prisma.pushNotificationDelivery.findFirst({
      where: { status: { in: ["FAILED", "INVALID_TOKEN"] } },
      orderBy: { failedAt: "desc" },
      select: { failedAt: true, errorCode: true },
    }),
    prisma.pushNotificationDelivery.groupBy({
      by: ["errorCode"],
      where: { errorCode: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { errorCode: "desc" } },
      take: 10,
    }),
  ]);

  return {
    activeDevices,
    usersWithPush,
    totalDeliveries,
    sent,
    failed,
    invalidTokens,
    retries,
    lastSentAt: lastSent?.sentAt?.toISOString() ?? lastSent?.createdAt?.toISOString() ?? null,
    lastErrorAt: lastFailed?.failedAt?.toISOString() ?? null,
    lastErrorCode: lastFailed?.errorCode ?? null,
    errorsByCode: errorGroups.map((g) => ({
      code: g.errorCode || "unknown",
      count: g._count._all,
    })),
  };
}

export async function getFirebaseAdminDiagnostics(baseUrl?: string) {
  const status = getFirebaseAdminSanitizedStatus();
  const metrics = await getFirebasePushMetrics();

  let serviceWorkerReachable: boolean | null = null;
  if (baseUrl) {
    try {
      const res = await fetch(new URL("/firebase-messaging-sw.js", baseUrl).toString(), {
        method: "HEAD",
        cache: "no-store",
      });
      serviceWorkerReachable = res.ok;
    } catch {
      serviceWorkerReachable = false;
    }
  }

  return {
    provider: "firebase-cloud-messaging",
    version: "http-v1",
    status,
    clientReady: isFirebaseClientReady(),
    adminConfigured: isFirebaseAdminConfigured(),
    serviceWorkerPath: "/firebase-messaging-sw.js",
    serviceWorkerReachable,
    messagingConfigPath: "/api/firebase/messaging-config",
    metrics,
    notes: [
      "Tokens FCM nunca são expostos no admin.",
      "Firebase Authentication não é usado — apenas Cloud Messaging.",
      "Web Push VAPID legado (web-push) permanece disponível em paralelo quando configurado.",
      "Status SENT significa aceito pelo FCM; entrega no dispositivo não é confirmada sem analytics.",
    ],
  };
}

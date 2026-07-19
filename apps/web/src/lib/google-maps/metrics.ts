import "server-only";

import { prisma } from "@/lib/prisma";
import { getGoogleMapsSanitizedStatus } from "./server-config";

export async function recordMapsUsage(params: {
  action: string;
  success: boolean;
  userId?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.mapsUsageEvent.create({
      data: {
        action: params.action.slice(0, 64),
        success: params.success,
        userId: params.userId,
        errorCode: params.errorCode?.slice(0, 80),
        metadata: params.metadata
          ? (JSON.parse(
              JSON.stringify(
                Object.fromEntries(
                  Object.entries(params.metadata).filter(
                    ([k]) => !/key|token|address|street|cep|postal/i.test(k)
                  )
                )
              )
            ) as object)
          : undefined,
      },
    });
  } catch {
    /* métricas best-effort */
  }
}

export async function getGoogleMapsAdminDiagnostics() {
  const status = getGoogleMapsSanitizedStatus();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    usageTotal,
    usageFail,
    lastFail,
    addressesWithCoords,
    addressesPending,
    partnersWithCoords,
    partnersPending,
    ongsWithCoords,
    ongsPending,
    byAction,
  ] = await Promise.all([
    prisma.mapsUsageEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.mapsUsageEvent.count({ where: { createdAt: { gte: since }, success: false } }),
    prisma.mapsUsageEvent.findFirst({
      where: { success: false },
      orderBy: { createdAt: "desc" },
      select: { errorCode: true, action: true, createdAt: true },
    }),
    prisma.address.count({ where: { latitude: { not: null }, longitude: { not: null } } }),
    prisma.address.count({
      where: { OR: [{ latitude: null }, { longitude: null }] },
    }),
    prisma.partnerProfile.count({
      where: { latitude: { not: null }, longitude: { not: null } },
    }),
    prisma.partnerProfile.count({
      where: {
        verificationStatus: "APPROVED",
        OR: [{ latitude: null }, { longitude: null }],
      },
    }),
    prisma.ongProfile.count({
      where: { latitude: { not: null }, longitude: { not: null } },
    }),
    prisma.ongProfile.count({
      where: {
        verificationStatus: "APPROVED",
        OR: [{ latitude: null }, { longitude: null }],
      },
    }),
    prisma.mapsUsageEvent.groupBy({
      by: ["action"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  return {
    provider: "google-maps",
    version: "maps-platform",
    status,
    metrics: {
      usageLast7d: usageTotal,
      failuresLast7d: usageFail,
      lastErrorCode: lastFail?.errorCode ?? null,
      lastErrorAction: lastFail?.action ?? null,
      lastErrorAt: lastFail?.createdAt?.toISOString() ?? null,
      addressesWithCoords,
      addressesPending,
      partnersWithCoords,
      partnersPendingApproved: partnersPending,
      ongsWithCoords,
      ongsPendingApproved: ongsPending,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count._all })),
    },
    notes: [
      "Diagnóstico não dispara Geocoding/Directions automaticamente.",
      "Restrinja a chave por domínio HTTP e APIs no Google Cloud.",
      "ViaCEP permanece o preenchimento gratuito por CEP.",
      "Endereços residenciais de clientes nunca são expostos em mapas públicos.",
    ],
  };
}

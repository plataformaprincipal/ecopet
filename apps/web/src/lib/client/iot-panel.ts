import type { PrismaClient } from "@prisma/client";

const DEVICE_LABELS: Record<string, string> = {
  COLLAR: "Coleira inteligente",
  GPS: "GPS / Rastreador",
  FEEDER: "Comedouro",
  WATER: "Bebedouro",
  CAMERA: "Câmera",
  SCALE: "Balança",
  LITTER: "Caixa de areia inteligente",
  SENSOR: "Sensor",
  DOOR: "Porta inteligente",
  TRACKER: "Rastreador",
  PURIFIER: "Purificador",
  VACUUM: "Robô aspirador",
};

export type ClientIotDevice = {
  id: string;
  name: string;
  deviceType: string;
  deviceLabel: string;
  petId: string | null;
  petName: string | null;
  status: string;
  battery: number | null;
  lastSyncAt: string | null;
  location: string | null;
  alerts: Array<{ id: string; message: string; severity: string; createdAt: string }>;
  recentLogs: Array<{ id: string; action: string; createdAt: string }>;
  recentReadings: Array<{ metricKey: string; value: number; unit: string | null; recordedAt: string }>;
};

export type ClientIotPanel = {
  devices: ClientIotDevice[];
  totalDevices: number;
  activeAlerts: number;
};

function labelForType(type: string) {
  const upper = type.toUpperCase();
  return DEVICE_LABELS[upper] ?? type;
}

export async function buildClientIotPanel(prisma: PrismaClient, userId: string): Promise<ClientIotPanel> {
  const devices = await prisma.iotDevice.findMany({
    where: { OR: [{ userId }, { ownerId: userId }] },
    include: {
      pet: { select: { id: true, name: true } },
      alerts: { where: { resolved: false }, orderBy: { createdAt: "desc" }, take: 5 },
      logs: { orderBy: { createdAt: "desc" }, take: 5 },
      readings: { orderBy: { recordedAt: "desc" }, take: 5 },
    },
    orderBy: { lastSyncAt: "desc" },
    take: 50,
  });

  const mapped: ClientIotDevice[] = devices.map((d) => ({
    id: d.id,
    name: d.name,
    deviceType: d.deviceType,
    deviceLabel: labelForType(d.deviceType),
    petId: d.petId,
    petName: d.pet?.name ?? null,
    status: d.status,
    battery: d.battery ?? null,
    lastSyncAt: d.lastSyncAt ? d.lastSyncAt.toISOString() : null,
    location: d.location ?? null,
    alerts: d.alerts.map((a) => ({
      id: a.id,
      message: a.message,
      severity: a.severity,
      createdAt: a.createdAt.toISOString(),
    })),
    recentLogs: d.logs.map((l) => ({
      id: l.id,
      action: l.action,
      createdAt: l.createdAt.toISOString(),
    })),
    recentReadings: d.readings.map((r) => ({
      metricKey: r.metricKey,
      value: r.value,
      unit: r.unit ?? null,
      recordedAt: r.recordedAt.toISOString(),
    })),
  }));

  return {
    devices: mapped,
    totalDevices: mapped.length,
    activeAlerts: mapped.reduce((sum, d) => sum + d.alerts.length, 0),
  };
}

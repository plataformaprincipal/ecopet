import { prisma } from "@ecopet/database";
import { asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "./audit-service.js";

const IOT_DISCLAIMER =
  "Os dados de IoT são indicadores preventivos e não substituem avaliação veterinária.";

export { IOT_DISCLAIMER };

async function assertDeviceAccess(deviceId: string, userId: string, role?: string) {
  const device = await prisma.iotDevice.findUnique({ where: { id: deviceId } });
  if (!device) throw new Error("DEVICE_NOT_FOUND");
  if (role === "GESTOR" || role === "ADMIN") return device;
  if (device.userId !== userId && device.ownerId !== userId) throw new Error("FORBIDDEN");
  return device;
}

export async function listUserDevices(userId: string, role?: string, scope?: { petId?: string; agroUnitId?: string }) {
  if (role === "GESTOR" || role === "ADMIN") {
    return prisma.iotDevice.findMany({
      where: {
        ...(scope?.petId ? { petId: scope.petId } : {}),
        ...(scope?.agroUnitId ? { agroUnitId: scope.agroUnitId } : {}),
      },
      include: { alerts: { where: { resolved: false }, take: 5 }, pet: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }
  return prisma.iotDevice.findMany({
    where: {
      OR: [{ userId }, { ownerId: userId }],
      ...(scope?.petId ? { petId: scope.petId } : {}),
      ...(scope?.agroUnitId ? { agroUnitId: scope.agroUnitId } : {}),
    },
    include: {
      alerts: { where: { resolved: false }, take: 5 },
      pet: { select: { id: true, name: true } },
      agroUnit: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function registerDevice(params: {
  userId: string;
  name: string;
  deviceType: string;
  ownerType: "pet" | "agro";
  petId?: string;
  agroUnitId?: string;
  location?: string;
  isDemo?: boolean;
}) {
  if (params.ownerType === "pet" && params.petId) {
    const pet = await prisma.pet.findFirst({ where: { id: params.petId, ownerId: params.userId } });
    if (!pet) throw new Error("PET_NOT_FOUND");
  }
  if (params.ownerType === "agro" && params.agroUnitId) {
    const unit = await prisma.agroUnit.findFirst({ where: { id: params.agroUnitId, ownerId: params.userId } });
    if (!unit) throw new Error("AGRO_UNIT_NOT_FOUND");
  }

  const device = await prisma.iotDevice.create({
    data: {
      name: params.name,
      deviceType: params.deviceType,
      ownerType: params.ownerType,
      ownerId: params.userId,
      userId: params.userId,
      petId: params.petId,
      agroUnitId: params.agroUnitId,
      location: params.location,
      isDemo: params.isDemo ?? true,
      status: "online",
      battery: 100,
      lastSyncAt: new Date(),
      metadata: asOptionalInputJson({ disclaimer: IOT_DISCLAIMER }),
    },
    include: { pet: { select: { id: true, name: true } } },
  });

  await prisma.iotDeviceLog.create({
    data: { deviceId: device.id, action: "DEVICE_REGISTERED", metadata: { userId: params.userId } },
  });

  await createAuditLog({
    userId: params.userId,
    action: "CREATE",
    module: "iot",
    resource: "device",
    resourceId: device.id,
  });

  return device;
}

export async function ingestReading(params: {
  deviceId: string;
  userId?: string;
  petId?: string;
  agroUnitId?: string;
  type?: string;
  metricKey: string;
  value: number;
  unit?: string;
  latitude?: number;
  longitude?: number;
  battery?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  role?: string;
}) {
  const device = await assertDeviceAccess(params.deviceId, params.userId ?? "", params.role);

  const reading = await prisma.iotReading.create({
    data: {
      deviceId: params.deviceId,
      metricKey: params.metricKey,
      type: params.type ?? params.metricKey,
      value: params.value,
      unit: params.unit,
      userId: params.userId ?? device.userId,
      petId: params.petId ?? device.petId,
      agroUnitId: params.agroUnitId ?? device.agroUnitId,
      latitude: params.latitude,
      longitude: params.longitude,
      battery: params.battery,
      metadata: asOptionalInputJson(params.metadata),
      recordedAt: params.timestamp ? new Date(params.timestamp) : new Date(),
    },
  });

  await prisma.iotDevice.update({
    where: { id: params.deviceId },
    data: {
      lastReading: new Date(),
      lastSyncAt: new Date(),
      battery: params.battery ?? device.battery,
      latitude: params.latitude ?? device.latitude,
      longitude: params.longitude ?? device.longitude,
      status: "online",
    },
  });

  await prisma.iotDeviceLog.create({
    data: { deviceId: params.deviceId, action: "READING_INGESTED", metadata: { metricKey: params.metricKey, value: params.value } },
  });

  if (params.metricKey.includes("low") || params.value < 20) {
    await maybeCreateAlert(params.deviceId, "warning", `Leitura ${params.metricKey}: ${params.value}${params.unit ?? ""}`);
  }

  return reading;
}

async function maybeCreateAlert(deviceId: string, severity: string, message: string) {
  const recent = await prisma.iotAlert.findFirst({
    where: { deviceId, message, resolved: false, createdAt: { gte: new Date(Date.now() - 3600000) } },
  });
  if (recent) return recent;
  return prisma.iotAlert.create({ data: { deviceId, severity, message } });
}

const SIM_METRICS: Record<string, { unit: string; min: number; max: number }> = {
  temperature: { unit: "°C", min: 36.5, max: 39.5 },
  activity: { unit: "min", min: 20, max: 180 },
  sleep: { unit: "h", min: 6, max: 14 },
  water_level: { unit: "%", min: 10, max: 100 },
  food_level: { unit: "%", min: 5, max: 100 },
  humidity: { unit: "%", min: 30, max: 90 },
  soil_moisture: { unit: "%", min: 15, max: 85 },
  wind: { unit: "km/h", min: 0, max: 45 },
  rain: { unit: "mm", min: 0, max: 80 },
  fuel: { unit: "%", min: 10, max: 100 },
};

export async function simulateReading(deviceId: string, userId: string, metricKey?: string, role?: string) {
  const device = await assertDeviceAccess(deviceId, userId, role);
  const key = metricKey ?? (device.ownerType === "agro" ? "soil_moisture" : "activity");
  const spec = SIM_METRICS[key] ?? { unit: "", min: 0, max: 100 };
  const value = Math.round((spec.min + Math.random() * (spec.max - spec.min)) * 10) / 10;

  const reading = await ingestReading({
    deviceId,
    userId,
    petId: device.petId ?? undefined,
    agroUnitId: device.agroUnitId ?? undefined,
    metricKey: key,
    value,
    unit: spec.unit,
    battery: Math.max(5, (device.battery ?? 100) - Math.random() * 2),
    latitude: device.latitude ?? -23.55 + Math.random() * 0.01,
    longitude: device.longitude ?? -46.63 + Math.random() * 0.01,
    metadata: { simulated: true, demo: device.isDemo },
    role,
  });

  if (value < spec.min + (spec.max - spec.min) * 0.15) {
    await maybeCreateAlert(deviceId, "warning", `${key} abaixo do esperado (${value}${spec.unit})`);
  }

  return reading;
}

export async function getDeviceReadings(deviceId: string, userId: string, role?: string, limit = 50) {
  await assertDeviceAccess(deviceId, userId, role);
  return prisma.iotReading.findMany({
    where: { deviceId },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
}

export async function listUserAlerts(userId: string, role?: string) {
  const devices = await listUserDevices(userId, role);
  const ids = devices.map((d) => d.id);
  if (!ids.length) return [];
  return prisma.iotAlert.findMany({
    where: { deviceId: { in: ids }, resolved: false },
    include: { device: { select: { id: true, name: true, deviceType: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function listAgroUnits(ownerId: string) {
  return prisma.agroUnit.findMany({
    where: { ownerId },
    include: { sensors: true, devices: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAgroUnit(ownerId: string, data: { name: string; location?: string; areaHa?: number }) {
  return prisma.agroUnit.create({
    data: { ownerId, ...data },
  });
}

export async function registerAgroSensor(agroUnitId: string, ownerId: string, data: { name: string; sensorType: string }) {
  const unit = await prisma.agroUnit.findFirst({ where: { id: agroUnitId, ownerId } });
  if (!unit) throw new Error("AGRO_UNIT_NOT_FOUND");
  return prisma.agroSensor.create({
    data: { agroUnitId, name: data.name, sensorType: data.sensorType, status: "online", battery: 100 },
  });
}

export async function getIotDashboard(userId: string, role?: string, scope?: { petId?: string; agroUnitId?: string }) {
  const devices = await listUserDevices(userId, role, scope);
  const alerts = await listUserAlerts(userId, role);
  const demoMode = devices.length === 0 || devices.every((d) => d.isDemo);
  return { devices, alerts, demoMode, disclaimer: IOT_DISCLAIMER };
}

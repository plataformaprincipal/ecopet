import { api } from "@/lib/api";

export interface IotDeviceDto {
  id: string;
  name: string;
  deviceType: string;
  ownerType: string;
  status: string;
  location: string | null;
  battery: number | null;
  isDemo: boolean;
  lastSyncAt: string | null;
  latitude: number | null;
  longitude: number | null;
  pet?: { id: string; name: string } | null;
  agroUnit?: { id: string; name: string } | null;
  alerts?: { id: string; severity: string; message: string }[];
}

export interface IotDashboardDto {
  devices: IotDeviceDto[];
  alerts: { id: string; severity: string; message: string; device?: { name: string } }[];
  demoMode: boolean;
  disclaimer: string;
}

export async function fetchIotDashboard(token: string, params?: { petId?: string; agroUnitId?: string }) {
  const qs = new URLSearchParams();
  if (params?.petId) qs.set("petId", params.petId);
  if (params?.agroUnitId) qs.set("agroUnitId", params.agroUnitId);
  const q = qs.toString();
  return api<IotDashboardDto>(`/api/iot/dashboard${q ? `?${q}` : ""}`, { token });
}

export async function registerIotDevice(
  token: string,
  data: { name: string; deviceType: string; ownerType: "pet" | "agro"; petId?: string; agroUnitId?: string; location?: string }
) {
  return api<IotDeviceDto>("/api/iot/devices", { method: "POST", token, body: JSON.stringify({ ...data, isDemo: true }) });
}

export async function simulateIotReading(token: string, deviceId: string, metricKey?: string) {
  return api("/api/iot/devices/" + deviceId + "/simulate", {
    method: "POST",
    token,
    body: JSON.stringify({ metricKey }),
  });
}

export async function fetchDeviceReadings(token: string, deviceId: string) {
  return api<{ id: string; metricKey: string; value: number; unit: string | null; recordedAt: string }[]>(
    `/api/iot/devices/${deviceId}/readings`,
    { token }
  );
}

export async function fetchAgroUnits(token: string) {
  return api<{ id: string; name: string; location: string | null; sensors: unknown[]; devices: unknown[] }[]>(
    "/api/iot/agro/units",
    { token }
  );
}

export async function createAgroUnit(token: string, data: { name: string; location?: string; areaHa?: number }) {
  return api("/api/iot/agro/units", { method: "POST", token, body: JSON.stringify(data) });
}

export async function registerAgroSensor(token: string, agroUnitId: string, data: { name: string; sensorType: string }) {
  return api(`/api/iot/agro/units/${agroUnitId}/sensors`, { method: "POST", token, body: JSON.stringify(data) });
}

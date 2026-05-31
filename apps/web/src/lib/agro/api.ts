import type { AgroDashboardStats, AgroAlert, AiAgroMessage } from "./types";
import {
  MOCK_FARMS,
  MOCK_SENSORS,
  MOCK_ROBOTS,
  MOCK_DRONES,
  MOCK_MACHINES,
  MOCK_LIVESTOCK,
  MOCK_SOIL,
  MOCK_WEATHER,
  MOCK_ALERTS,
  MOCK_ML_MODELS,
  MOCK_AUTOMATIONS,
  MOCK_STOCK,
  MOCK_PLANTING,
  MOCK_HARVEST,
  MOCK_MARKETPLACE,
  MOCK_DASHBOARD_STATS,
  MOCK_TELEMETRY,
  MOCK_AI_RECOMMENDATIONS,
  MOCK_PLOTS,
  getFarmById,
  getPlotsByFarm,
  getSensorsByFarm,
  getRobotsByFarm,
  getDronesByFarm,
} from "./mock-data";

const DELAY = 400;

async function delay<T>(data: T): Promise<T> {
  await new Promise((r) => setTimeout(r, DELAY));
  return data;
}

/** Futuro: GET /api/agro/dashboard */
export async function fetchDashboardStats(): Promise<AgroDashboardStats> {
  return delay({ ...MOCK_DASHBOARD_STATS });
}

export async function fetchFarms() {
  return delay([...MOCK_FARMS]);
}

export async function fetchFarm(id: string) {
  return delay(getFarmById(id));
}

export async function fetchPlots(farmId?: string) {
  return delay(farmId ? getPlotsByFarm(farmId) : [...MOCK_PLOTS]);
}

export async function fetchSensors(farmId?: string) {
  return delay(farmId ? getSensorsByFarm(farmId) : [...MOCK_SENSORS]);
}

export async function fetchRobots(farmId?: string) {
  return delay(farmId ? getRobotsByFarm(farmId) : [...MOCK_ROBOTS]);
}

export async function fetchDrones(farmId?: string) {
  return delay(farmId ? getDronesByFarm(farmId) : [...MOCK_DRONES]);
}

export async function fetchMachines() {
  return delay([...MOCK_MACHINES]);
}

export async function fetchLivestock() {
  return delay([...MOCK_LIVESTOCK]);
}

export async function fetchSoil() {
  return delay([...MOCK_SOIL]);
}

export async function fetchWeather() {
  return delay({ ...MOCK_WEATHER });
}

export async function fetchAlerts() {
  return delay([...MOCK_ALERTS]);
}

export async function fetchMLModels() {
  return delay([...MOCK_ML_MODELS]);
}

export async function fetchAutomations() {
  return delay([...MOCK_AUTOMATIONS]);
}

export async function fetchStock() {
  return delay([...MOCK_STOCK]);
}

export async function fetchPlanting() {
  return delay([...MOCK_PLANTING]);
}

export async function fetchHarvest() {
  return delay([...MOCK_HARVEST]);
}

export async function fetchAgroMarketplace() {
  return delay([...MOCK_MARKETPLACE]);
}

export async function fetchTelemetry() {
  return delay({ ...MOCK_TELEMETRY });
}

export async function fetchAiRecommendations() {
  return delay([...MOCK_AI_RECOMMENDATIONS]);
}

export {
  MOCK_FARMS,
  MOCK_ALERTS,
  MOCK_ROBOTS,
  MOCK_DRONES,
  MOCK_SENSORS,
  MOCK_ML_MODELS,
};

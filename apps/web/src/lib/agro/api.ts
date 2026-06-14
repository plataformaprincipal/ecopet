import type {
  AgroDashboardStats,
  AgroAlert,
  AiAgroMessage,
  AgroFarm,
  AgroPlot,
  IoTSensor,
  AgroRobot,
  AgroDrone,
  AgroMachine,
  LivestockAnimal,
  SoilReading,
  WeatherForecast,
  MLModel,
  AutomationRule,
  StockItem,
  PlantingRecord,
  HarvestRecord,
  AgroMarketplaceItem,
  RealtimeTelemetry,
  AiAgroRecommendation,
} from "./types";

const EMPTY_STATS: AgroDashboardStats = {
  farmsCount: 0,
  monitoredAreaHa: 0,
  estimatedProduction: 0,
  sensorsOnline: 0,
  robotsActive: 0,
  dronesActive: 0,
  criticalAlerts: 0,
  operationalEfficiency: 0,
  costPerHectare: 0,
  harvestForecast: 0,
};

const EMPTY_WEATHER: WeatherForecast = {
  farmId: "",
  current: { temp: 0, humidity: 0, wind: 0, rain: 0 },
  forecast: [],
  alerts: [],
};

const EMPTY_TELEMETRY: RealtimeTelemetry = {
  temperature: 0,
  humidity: 0,
  soilPh: 0,
  soilMoisture: 0,
  irrigationLevel: 0,
  windSpeed: 0,
  luminosity: 0,
  pestPresence: false,
  updatedAt: new Date().toISOString(),
};

export async function fetchDashboardStats(): Promise<AgroDashboardStats> {
  return { ...EMPTY_STATS };
}

export async function fetchFarms(): Promise<AgroFarm[]> {
  return [];
}

export async function fetchFarm(_id: string): Promise<AgroFarm | undefined> {
  return undefined;
}

export async function fetchPlots(_farmId?: string): Promise<AgroPlot[]> {
  return [];
}

export async function fetchSensors(_farmId?: string): Promise<IoTSensor[]> {
  return [];
}

export async function fetchRobots(_farmId?: string): Promise<AgroRobot[]> {
  return [];
}

export async function fetchDrones(_farmId?: string): Promise<AgroDrone[]> {
  return [];
}

export async function fetchMachines(): Promise<AgroMachine[]> {
  return [];
}

export async function fetchLivestock(): Promise<LivestockAnimal[]> {
  return [];
}

export async function fetchSoil(): Promise<SoilReading[]> {
  return [];
}

export async function fetchWeather(): Promise<WeatherForecast> {
  return { ...EMPTY_WEATHER };
}

export async function fetchAlerts(): Promise<AgroAlert[]> {
  return [];
}

export async function fetchMLModels(): Promise<MLModel[]> {
  return [];
}

export async function fetchAutomations(): Promise<AutomationRule[]> {
  return [];
}

export async function fetchStock(): Promise<StockItem[]> {
  return [];
}

export async function fetchPlanting(): Promise<PlantingRecord[]> {
  return [];
}

export async function fetchHarvest(): Promise<HarvestRecord[]> {
  return [];
}

export async function fetchAgroMarketplace(): Promise<AgroMarketplaceItem[]> {
  return [];
}

export async function fetchTelemetry(): Promise<RealtimeTelemetry> {
  return { ...EMPTY_TELEMETRY };
}

export async function fetchAiRecommendations(): Promise<AiAgroRecommendation[]> {
  return [];
}

export async function fetchAgroAiMessages(): Promise<AiAgroMessage[]> {
  return [];
}

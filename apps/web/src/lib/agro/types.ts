export type DeviceStatus = "online" | "offline" | "warning" | "maintenance";
export type AlertPriority = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type MLModelStatus = "training" | "active" | "validating";
export type RobotStatus = "active" | "idle" | "charging" | "paused" | "error";
export type DroneStatus = "flying" | "idle" | "charging" | "maintenance";
export type AutomationStatus = "active" | "paused" | "triggered";

export interface AgroFarm {
  id: string;
  name: string;
  owner: string;
  location: string;
  region: string;
  totalAreaHa: number;
  productionType: string[];
  crops: string[];
  livestockCount: number;
  sensorCount: number;
  robotCount: number;
  droneCount: number;
  machineCount: number;
  teamSize: number;
  productivityIndex: number;
  historicalYield: { year: number; yield: number }[];
  image: string;
  coordinates: { lat: number; lng: number };
}

export interface AgroPlot {
  id: string;
  farmId: string;
  name: string;
  areaHa: number;
  crop: string;
  stage: string;
  risk: "low" | "medium" | "high";
  expectedYield: number;
  ndvi: number;
}

export interface IoTSensor {
  id: string;
  name: string;
  type: string;
  farmId: string;
  location: string;
  status: DeviceStatus;
  battery: number;
  lastReading: string;
  lastReadingAt: string;
  alerts: number;
  data: Record<string, number | string>;
}

export interface AgroRobot {
  id: string;
  name: string;
  type: string;
  farmId: string;
  status: RobotStatus;
  location: string;
  mission: string;
  battery: number;
  speed: number;
  areaCoveredHa: number;
  productivity: number;
  alerts: string[];
}

export interface AgroDrone {
  id: string;
  name: string;
  farmId: string;
  status: DroneStatus;
  battery: number;
  altitude: number;
  areaCoveredHa: number;
  mission: string;
  lastFlight: string;
  imagesCaptured: number;
  aiAlert?: string;
}

export interface AgroMachine {
  id: string;
  name: string;
  type: string;
  farmId: string;
  status: DeviceStatus;
  operator: string;
  fuel: number;
  hoursUsed: number;
  nextMaintenance: string;
  failureRisk: number;
  operationalCost: number;
}

export interface LivestockAnimal {
  id: string;
  tag: string;
  farmId: string;
  breed: string;
  weight: number;
  health: "good" | "warning" | "critical";
  location: string;
  sensorId?: string;
  lastVaccination: string;
  activity: number;
  aiInsight?: string;
}

export interface SoilReading {
  id: string;
  farmId: string;
  plotId: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  compaction: number;
  organicMatter: number;
  salinity: number;
  aiRecommendation: string;
  recordedAt: string;
}

export interface WeatherForecast {
  farmId: string;
  current: { temp: number; humidity: number; wind: number; rain: number };
  forecast: { day: string; tempMax: number; tempMin: number; rain: number; risk: string }[];
  alerts: { type: string; plot: string; impact: string }[];
}

export interface AgroAlert {
  id: string;
  title: string;
  description: string;
  priority: AlertPriority;
  source: string;
  origin: string;
  aiRecommendation: string;
  suggestedAction: string;
  status: AlertStatus;
  createdAt: string;
}

export interface MLModel {
  id: string;
  name: string;
  type: string;
  status: MLModelStatus;
  accuracy: number;
  lastUpdated: string;
  description: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  status: AutomationStatus;
  lastRun: string;
  logs: string[];
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  expiry?: string;
  farmId: string;
  aiAlert?: string;
}

export interface PlantingRecord {
  id: string;
  farmId: string;
  plotId: string;
  crop: string;
  stage: string;
  areaHa: number;
  plantedAt: string;
  seed: string;
  irrigation: string;
  germinationForecast: string;
  estimatedCost: number;
  expectedYield: number;
  risk: string;
  aiRecommendation: string;
}

export interface HarvestRecord {
  id: string;
  farmId: string;
  plotId: string;
  crop: string;
  status: string;
  forecastDate: string;
  expectedYield: number;
  estimatedLoss: number;
  machinesAvailable: number;
  robotsAvailable: number;
  logistics: string;
  storage: string;
}

export interface AgroMarketplaceItem {
  id: string;
  name: string;
  category: string;
  supplier: string;
  price: number;
  rating: number;
  image: string;
  aiRecommended?: boolean;
  description: string;
}

export interface AgroDashboardStats {
  farmsCount: number;
  monitoredAreaHa: number;
  estimatedProduction: number;
  sensorsOnline: number;
  robotsActive: number;
  dronesActive: number;
  criticalAlerts: number;
  operationalEfficiency: number;
  costPerHectare: number;
  harvestForecast: number;
}

export interface RealtimeTelemetry {
  temperature: number;
  humidity: number;
  soilPh: number;
  soilMoisture: number;
  irrigationLevel: number;
  windSpeed: number;
  luminosity: number;
  pestPresence: boolean;
  updatedAt: string;
}

export interface AiAgroMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AiAgroRecommendation {
  id: string;
  tag: string;
  title: string;
  description: string;
  action?: string;
  href?: string;
}

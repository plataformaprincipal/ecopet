import type {
  AgroFarm,
  AgroPlot,
  IoTSensor,
  AgroRobot,
  AgroDrone,
  AgroMachine,
  LivestockAnimal,
  SoilReading,
  WeatherForecast,
  AgroAlert,
  MLModel,
  AutomationRule,
  StockItem,
  PlantingRecord,
  HarvestRecord,
  AgroMarketplaceItem,
  AgroDashboardStats,
  RealtimeTelemetry,
  AiAgroRecommendation,
} from "./types";
import { AGRO_IMAGES } from "./config";

export const MOCK_FARMS: AgroFarm[] = [
  {
    id: "farm1", name: "Fazenda ECOPET Verde", owner: "Grupo ECOPET Agro",
    location: "Ribeirão Preto, SP", region: "Sudeste", totalAreaHa: 1250,
    productionType: ["Grãos", "Pecuária"], crops: ["Soja", "Milho", "Pastagem"],
    livestockCount: 840, sensorCount: 48, robotCount: 6, droneCount: 3, machineCount: 12,
    teamSize: 28, productivityIndex: 87, image: AGRO_IMAGES.farm,
    coordinates: { lat: -21.1775, lng: -47.8103 },
    historicalYield: [{ year: 2024, yield: 3850 }, { year: 2025, yield: 4120 }],
  },
  {
    id: "farm2", name: "Sítio Boa Vista", owner: "Maria AgroTech",
    location: "Campinas, SP", region: "Sudeste", totalAreaHa: 320,
    productionType: ["Hortifruti", "Orgânico"], crops: ["Alface", "Tomate", "Morango"],
    livestockCount: 45, sensorCount: 22, robotCount: 3, droneCount: 2, machineCount: 5,
    teamSize: 12, productivityIndex: 92, image: AGRO_IMAGES.field,
    coordinates: { lat: -22.9099, lng: -47.0626 },
    historicalYield: [{ year: 2024, yield: 890 }, { year: 2025, yield: 945 }],
  },
  {
    id: "farm3", name: "Haras & Grãos Sul", owner: "Cooperativa Agro Sul",
    location: "Passo Fundo, RS", region: "Sul", totalAreaHa: 2800,
    productionType: ["Grãos", "Pecuária de corte"], crops: ["Soja", "Trigo", "Aveia"],
    livestockCount: 2100, sensorCount: 86, robotCount: 8, droneCount: 5, machineCount: 24,
    teamSize: 56, productivityIndex: 84, image: AGRO_IMAGES.harvest,
    coordinates: { lat: -28.262, lng: -52.406 },
    historicalYield: [{ year: 2024, yield: 9200 }, { year: 2025, yield: 9580 }],
  },
];

export const MOCK_PLOTS: AgroPlot[] = [
  { id: "plot1", farmId: "farm1", name: "Talhão A1", areaHa: 180, crop: "Soja", stage: "Florescimento", risk: "low", expectedYield: 58, ndvi: 0.78 },
  { id: "plot2", farmId: "farm1", name: "Talhão B2", areaHa: 220, crop: "Soja", stage: "Vegetativo", risk: "high", expectedYield: 42, ndvi: 0.62 },
  { id: "plot3", farmId: "farm1", name: "Talhão C3", areaHa: 150, crop: "Milho", stage: "Enchimento", risk: "medium", expectedYield: 95, ndvi: 0.71 },
  { id: "plot4", farmId: "farm2", name: "Estufa 01", areaHa: 2.5, crop: "Tomate", stage: "Frutificação", risk: "low", expectedYield: 120, ndvi: 0.85 },
  { id: "plot5", farmId: "farm3", name: "Talhão Norte", areaHa: 450, crop: "Soja", stage: "Maturação", risk: "low", expectedYield: 55, ndvi: 0.80 },
];

export const MOCK_SENSORS: IoTSensor[] = [
  { id: "s1", name: "Sensor Solo A1-N", type: "Sensor de solo", farmId: "farm1", location: "Talhão A1", status: "online", battery: 87, lastReading: "Umidade 42%", lastReadingAt: "2026-05-24T14:30:00Z", alerts: 0, data: { ph: 6.2, moisture: 42, temp: 24 } },
  { id: "s2", name: "Estação Meteo Central", type: "Estação meteorológica", farmId: "farm1", location: "Sede", status: "online", battery: 100, lastReading: "28°C · 65% UR", lastReadingAt: "2026-05-24T14:32:00Z", alerts: 0, data: { temp: 28, humidity: 65, wind: 12 } },
  { id: "s3", name: "Irrigação B2", type: "Sensor de irrigação", farmId: "farm1", location: "Talhão B2", status: "warning", battery: 45, lastReading: "Nível 32%", lastReadingAt: "2026-05-24T14:28:00Z", alerts: 1, data: { level: 32, flow: 45 } },
  { id: "s4", name: "Coleira #1847", type: "Coleira inteligente", farmId: "farm1", location: "Pasto 3", status: "online", battery: 72, lastReading: "Atividade normal", lastReadingAt: "2026-05-24T14:31:00Z", alerts: 0, data: { activity: 78, heartRate: 68 } },
  { id: "s5", name: "Câmera Cerca Norte", type: "Câmera inteligente", farmId: "farm1", location: "Cerca Norte", status: "online", battery: 100, lastReading: "Sem intrusão", lastReadingAt: "2026-05-24T14:29:00Z", alerts: 0, data: { motion: 0 } },
  { id: "s6", name: "Silo Grãos 01", type: "Sensor de silo", farmId: "farm3", location: "Armazém", status: "online", battery: 91, lastReading: "78% capacidade", lastReadingAt: "2026-05-24T14:25:00Z", alerts: 0, data: { fill: 78, temp: 22 } },
  { id: "s7", name: "Combustível PX-400", type: "Sensor de combustível", farmId: "farm1", location: "Galpão", status: "offline", battery: 12, lastReading: "Offline", lastReadingAt: "2026-05-24T10:00:00Z", alerts: 2, data: { fuel: 0 } },
  { id: "s8", name: "Balança Entrada", type: "Balança inteligente", farmId: "farm3", location: "Portaria", status: "online", battery: 100, lastReading: "12.450 kg", lastReadingAt: "2026-05-24T13:50:00Z", alerts: 0, data: { weight: 12450 } },
];

export const MOCK_ROBOTS: AgroRobot[] = [
  { id: "r1", name: "AgroBot Plantio X1", type: "Robô de plantio", farmId: "farm1", status: "active", location: "Talhão A1", mission: "Plantio precision row 12-18", battery: 68, speed: 3.2, areaCoveredHa: 4.2, productivity: 94, alerts: [] },
  { id: "r2", name: "SprayBot Pro", type: "Robô pulverizador", farmId: "farm1", status: "active", location: "Talhão B2", mission: "Pulverização preventiva pragas", battery: 55, speed: 2.8, areaCoveredHa: 8.5, productivity: 89, alerts: ["Umidade baixa detectada"] },
  { id: "r3", name: "InspectBot Alpha", type: "Robô de inspeção", farmId: "farm1", status: "idle", location: "Base Central", mission: "Aguardando próxima missão", battery: 92, speed: 0, areaCoveredHa: 0, productivity: 0, alerts: [] },
  { id: "r4", name: "WeedBot Capina", type: "Robô de capina", farmId: "farm2", status: "active", location: "Estufa 01", mission: "Capina autônoma linha 3-7", battery: 71, speed: 1.5, areaCoveredHa: 0.8, productivity: 96, alerts: [] },
  { id: "r5", name: "FeedBot Pecuária", type: "Robô alimentador", farmId: "farm1", status: "active", location: "Pasto 3", mission: "Distribuição ração — lote B", battery: 48, speed: 2.0, areaCoveredHa: 12, productivity: 91, alerts: ["Bateria abaixo de 50%"] },
  { id: "r6", name: "MilkerBot 300", type: "Robô de ordenha", farmId: "farm3", status: "charging", location: "Estação de carga", mission: "Recarga — ciclo 14h30", battery: 22, speed: 0, areaCoveredHa: 0, productivity: 0, alerts: [] },
];

export const MOCK_DRONES: AgroDrone[] = [
  { id: "d1", name: "DJI Agro Mapper 01", farmId: "farm1", status: "flying", battery: 62, altitude: 85, areaCoveredHa: 45, mission: "Mapeamento NDVI Talhão A1-B2", lastFlight: "2026-05-24T14:00:00Z", imagesCaptured: 342, aiAlert: "Área seca detectada no setor NE" },
  { id: "d2", name: "SprayDrone XT", farmId: "farm1", status: "idle", battery: 100, altitude: 0, areaCoveredHa: 0, mission: "Standby", lastFlight: "2026-05-23T16:30:00Z", imagesCaptured: 0 },
  { id: "d3", name: "ScoutDrone Vision", farmId: "farm3", status: "flying", battery: 78, altitude: 120, areaCoveredHa: 120, mission: "Contagem rebanho + cercas", lastFlight: "2026-05-24T13:45:00Z", imagesCaptured: 890, aiAlert: "2 animais isolados detectados" },
  { id: "d4", name: "AgroEye Mini", farmId: "farm2", status: "charging", battery: 35, altitude: 0, areaCoveredHa: 0, mission: "Recarga", lastFlight: "2026-05-24T11:00:00Z", imagesCaptured: 56 },
];

export const MOCK_MACHINES: AgroMachine[] = [
  { id: "m1", name: "Trator John Deere 8R", type: "Trator", farmId: "farm1", status: "online", operator: "Carlos Silva", fuel: 72, hoursUsed: 1240, nextMaintenance: "2026-06-15", failureRisk: 12, operationalCost: 450 },
  { id: "m2", name: "Colheitadeira Case IH", type: "Colheitadeira", farmId: "farm1", status: "online", operator: "João Pereira", fuel: 85, hoursUsed: 890, nextMaintenance: "2026-07-01", failureRisk: 8, operationalCost: 890 },
  { id: "m3", name: "Pulverizador PX-400", type: "Pulverizador", farmId: "farm1", status: "maintenance", operator: "—", fuel: 0, hoursUsed: 2100, nextMaintenance: "Em andamento", failureRisk: 45, operationalCost: 320 },
  { id: "m4", name: "Caminhão GR-120", type: "Caminhão", farmId: "farm1", status: "warning", operator: "Pedro Santos", fuel: 40, hoursUsed: 5600, nextMaintenance: "2026-05-28", failureRisk: 68, operationalCost: 280 },
  { id: "m5", name: "Pivot Irrigação 01", type: "Irrigador", farmId: "farm3", status: "online", operator: "Automático", fuel: 100, hoursUsed: 3200, nextMaintenance: "2026-08-10", failureRisk: 5, operationalCost: 180 },
];

export const MOCK_LIVESTOCK: LivestockAnimal[] = [
  { id: "a1", tag: "#1847", farmId: "farm1", breed: "Nelore", weight: 485, health: "good", location: "Pasto 3", sensorId: "s4", lastVaccination: "2026-03-15", activity: 78 },
  { id: "a2", tag: "#2103", farmId: "farm1", breed: "Angus", weight: 520, health: "warning", location: "Pasto 2", sensorId: "s4", lastVaccination: "2026-02-20", activity: 42, aiInsight: "Queda de atividade — possível início de doença" },
  { id: "a3", tag: "#0892", farmId: "farm3", breed: "Hereford", weight: 610, health: "good", location: "Pasto Norte", lastVaccination: "2026-04-01", activity: 85 },
  { id: "a4", tag: "#0456", farmId: "farm3", breed: "Nelore", weight: 390, health: "critical", location: "Isolamento", lastVaccination: "2026-01-10", activity: 18, aiInsight: "Animal isolado — febre detectada via coleira" },
];

export const MOCK_SOIL: SoilReading[] = [
  { id: "soil1", farmId: "farm1", plotId: "plot1", ph: 6.2, nitrogen: 28, phosphorus: 18, potassium: 145, moisture: 42, compaction: 1.2, organicMatter: 3.8, salinity: 0.4, aiRecommendation: "Solo equilibrado. Manter irrigação atual.", recordedAt: "2026-05-24T08:00:00Z" },
  { id: "soil2", farmId: "farm1", plotId: "plot2", ph: 5.8, nitrogen: 15, phosphorus: 12, potassium: 98, moisture: 28, compaction: 1.8, organicMatter: 2.9, salinity: 0.6, aiRecommendation: "Adubação nitrogenada recomendada. Irrigar em 24h.", recordedAt: "2026-05-24T08:00:00Z" },
  { id: "soil3", farmId: "farm1", plotId: "plot3", ph: 6.0, nitrogen: 12, phosphorus: 22, potassium: 160, moisture: 38, compaction: 1.4, organicMatter: 3.2, salinity: 0.3, aiRecommendation: "Correção de nitrogênio urgente. Risco de baixa produtividade.", recordedAt: "2026-05-24T08:00:00Z" },
];

export const MOCK_WEATHER: WeatherForecast = {
  farmId: "farm1",
  current: { temp: 28, humidity: 65, wind: 12, rain: 0 },
  forecast: [
    { day: "Hoje", tempMax: 30, tempMin: 18, rain: 0, risk: "Baixo" },
    { day: "Amanhã", tempMax: 32, tempMin: 20, rain: 5, risk: "Seca" },
    { day: "Qua", tempMax: 26, tempMin: 19, rain: 45, risk: "Chuva intensa" },
    { day: "Qui", tempMax: 24, tempMin: 17, rain: 80, risk: "Tempestade" },
    { day: "Sex", tempMax: 27, tempMin: 16, rain: 10, risk: "Geada leve" },
  ],
  alerts: [
    { type: "Chuva intensa", plot: "Talhão B2", impact: "Risco de erosão — adiar pulverização" },
    { type: "Seca", plot: "Talhão A1", impact: "Irrigar nas próximas 24h" },
    { type: "Geada leve", plot: "Estufa 01", impact: "Proteger culturas sensíveis" },
  ],
};

export const MOCK_ALERTS: AgroAlert[] = [
  { id: "al1", title: "Praga detectada — Talhão B2", description: "NDVI em queda + imagem drone indica lagarta-do-cartucho", priority: "critical", source: "IA + Drone", origin: "Talhão B2", aiRecommendation: "Pulverização preventiva em 48h com SprayBot Pro", suggestedAction: "Acionar robô pulverizador", status: "open", createdAt: "2026-05-24T13:00:00Z" },
  { id: "al2", title: "Solo seco — Talhão B2", description: "Umidade do solo em 28% (mínimo: 35%)", priority: "high", source: "Sensor IoT", origin: "Sensor Solo B2", aiRecommendation: "Irrigar amanhã 5h-7h", suggestedAction: "Programar irrigação automática", status: "open", createdAt: "2026-05-24T12:30:00Z" },
  { id: "al3", title: "Robô com bateria baixa", description: "FeedBot Pecuária em 48%", priority: "medium", source: "Central Robôs", origin: "FeedBot", aiRecommendation: "Retornar à base em 30 min", suggestedAction: "Comando: retornar à base", status: "acknowledged", createdAt: "2026-05-24T14:00:00Z" },
  { id: "al4", title: "Animal com baixa atividade", description: "Boi #2103 — atividade 42% abaixo da média", priority: "high", source: "IA Rebanho", origin: "Pasto 2", aiRecommendation: "Isolar e acionar veterinário", suggestedAction: "Verificar rebanho", status: "open", createdAt: "2026-05-24T11:00:00Z" },
  { id: "al5", title: "Estoque crítico — Defensivo", description: "Glifosato abaixo do mínimo (120L restantes)", priority: "high", source: "Estoque", origin: "Depósito Central", aiRecommendation: "Comprar 500L — fornecedor AgroSupply", suggestedAction: "Abrir marketplace agro", status: "open", createdAt: "2026-05-24T09:00:00Z" },
  { id: "al6", title: "Máquina com falha provável", description: "Caminhão GR-120 — risco 68%", priority: "critical", source: "ML Manutenção", origin: "GR-120", aiRecommendation: "Manutenção preventiva imediata", suggestedAction: "Abrir chamado", status: "open", createdAt: "2026-05-24T08:00:00Z" },
];

export const MOCK_ML_MODELS: MLModel[] = [
  { id: "ml1", name: "Produtividade Safra 2026", type: "productivity", status: "active", accuracy: 94.2, lastUpdated: "2026-05-23", description: "Previsão de produtividade por talhão" },
  { id: "ml2", name: "Irrigação Inteligente", type: "irrigation", status: "active", accuracy: 91.8, lastUpdated: "2026-05-24", description: "Otimização de consumo de água" },
  { id: "ml3", name: "Detecção de Pragas v3", type: "pests", status: "validating", accuracy: 88.5, lastUpdated: "2026-05-22", description: "Classificação por imagem de drone" },
  { id: "ml4", name: "Custo por Hectare", type: "costs", status: "active", accuracy: 92.1, lastUpdated: "2026-05-20", description: "Otimização de custos operacionais" },
  { id: "ml5", name: "Demanda de Insumos", type: "demand", status: "training", accuracy: 76.3, lastUpdated: "2026-05-24", description: "Previsão de consumo por safra" },
  { id: "ml6", name: "Saúde Animal IA", type: "animal_health", status: "active", accuracy: 89.7, lastUpdated: "2026-05-23", description: "Detecção precoce de doenças" },
];

export const MOCK_AUTOMATIONS: AutomationRule[] = [
  { id: "au1", name: "Irrigar automaticamente", trigger: "Umidade solo < 35%", condition: "Talhão B2 · Sem chuva prevista", action: "Acionar pivot + notificar equipe", status: "active", lastRun: "2026-05-23T05:00:00Z", logs: ["2026-05-23 05:00 — Irrigação iniciada", "2026-05-23 07:30 — Irrigação concluída"] },
  { id: "au2", name: "Drone inspeção praga", trigger: "NDVI cai > 5% em 3 dias", condition: "Qualquer talhão soja", action: "Enviar ScoutDrone + gerar relatório", status: "triggered", lastRun: "2026-05-24T14:00:00Z", logs: ["2026-05-24 14:00 — Drone enviado Talhão B2"] },
  { id: "au3", name: "Robô pulverizador", trigger: "Alerta praga confirmado", condition: "Prioridade alta+", action: "Acionar SprayBot Pro", status: "active", lastRun: "2026-05-20T10:00:00Z", logs: [] },
  { id: "au4", name: "Comprar insumo", trigger: "Estoque < mínimo", condition: "Defensivos e fertilizantes", action: "Sugerir compra marketplace", status: "active", lastRun: "2026-05-24T09:00:00Z", logs: ["2026-05-24 09:00 — Alerta glifosato"] },
  { id: "au5", name: "Manutenção preditiva", trigger: "Risco falha > 60%", condition: "Máquinas e implementos", action: "Abrir chamado + agendar técnico", status: "active", lastRun: "2026-05-24T08:00:00Z", logs: ["2026-05-24 08:00 — Chamado GR-120"] },
];

export const MOCK_STOCK: StockItem[] = [
  { id: "st1", name: "Sementes Soja RR", category: "Sementes", quantity: 2400, unit: "kg", minStock: 500, farmId: "farm1" },
  { id: "st2", name: "Ureia 45%", category: "Fertilizantes", quantity: 8500, unit: "kg", minStock: 2000, farmId: "farm1" },
  { id: "st3", name: "Glifosato 480", category: "Defensivos", quantity: 120, unit: "L", minStock: 200, farmId: "farm1", aiAlert: "Estoque crítico — compra recomendada" },
  { id: "st4", name: "Ração Concentrada", category: "Ração", quantity: 12000, unit: "kg", minStock: 3000, farmId: "farm1" },
  { id: "st5", name: "Vacina Aftosa", category: "Medicamentos", quantity: 450, unit: "doses", minStock: 100, expiry: "2026-08-15", farmId: "farm1", aiAlert: "Validade em 83 dias" },
  { id: "st6", name: "Diesel S10", category: "Combustível", quantity: 8500, unit: "L", minStock: 2000, farmId: "farm1" },
];

export const MOCK_PLANTING: PlantingRecord[] = [
  { id: "pl1", farmId: "farm1", plotId: "plot1", crop: "Soja", stage: "Florescimento", areaHa: 180, plantedAt: "2025-10-15", seed: "TMG 2381 IPRO", irrigation: "Pivot automático", germinationForecast: "98%", estimatedCost: 285000, expectedYield: 58, risk: "Baixo", aiRecommendation: "Manter monitoramento NDVI semanal" },
  { id: "pl2", farmId: "farm1", plotId: "plot2", crop: "Soja", stage: "Vegetativo", areaHa: 220, plantedAt: "2025-10-20", seed: "NS 5445 IPRO", irrigation: "Aspersão", germinationForecast: "95%", estimatedCost: 320000, expectedYield: 42, risk: "Alto", aiRecommendation: "Atenção a pragas — pulverização preventiva" },
  { id: "pl3", farmId: "farm2", plotId: "plot4", crop: "Tomate", stage: "Frutificação", areaHa: 2.5, plantedAt: "2026-02-01", seed: "Santa Clara", irrigation: "Gotejamento", germinationForecast: "99%", estimatedCost: 45000, expectedYield: 120, risk: "Baixo", aiRecommendation: "Colheita prevista em 18 dias" },
];

export const MOCK_HARVEST: HarvestRecord[] = [
  { id: "hv1", farmId: "farm1", plotId: "plot1", crop: "Soja", status: "Previsão 15/jun", forecastDate: "2026-06-15", expectedYield: 10440, estimatedLoss: 2.1, machinesAvailable: 2, robotsAvailable: 1, logistics: "3 caminhões disponíveis", storage: "Silo 78% — OK" },
  { id: "hv2", farmId: "farm1", plotId: "plot3", crop: "Milho", status: "Previsão 28/jul", forecastDate: "2026-07-28", expectedYield: 14250, estimatedLoss: 1.8, machinesAvailable: 2, robotsAvailable: 0, logistics: "Contratar 2 caminhões", storage: "Silo — verificar capacidade" },
  { id: "hv3", farmId: "farm3", plotId: "plot5", crop: "Soja", status: "Em colheita", forecastDate: "2026-05-20", expectedYield: 24750, estimatedLoss: 1.2, machinesAvailable: 3, robotsAvailable: 2, logistics: "Operação ativa", storage: "Armazém cooperativa" },
];

export const MOCK_MARKETPLACE: AgroMarketplaceItem[] = [
  { id: "mp1", name: "Drone DJI Agras T50", category: "Drones", supplier: "AgroTech Brasil", price: 289000, rating: 4.9, image: AGRO_IMAGES.drone, aiRecommended: true, description: "Pulverização e mapeamento de precisão" },
  { id: "mp2", name: "Kit 10 Sensores Solo IoT", category: "Sensores", supplier: "FieldSense", price: 18900, rating: 4.7, image: AGRO_IMAGES.sensor, description: "pH, umidade, NPK em tempo real" },
  { id: "mp3", name: "Robô Pulverizador Autônomo", category: "Robôs", supplier: "RoboAgro", price: 450000, rating: 4.8, image: AGRO_IMAGES.robot, aiRecommended: true, description: "Cobertura 12 ha/dia" },
  { id: "mp4", name: "Glifosato 480 — 1000L", category: "Insumos", supplier: "AgroSupply", price: 12500, rating: 4.5, image: AGRO_IMAGES.marketplace, description: "Entrega em 48h" },
  { id: "mp5", name: "Consultoria Safra Inteligente", category: "Consultorias", supplier: "ECOPET Agro IA", price: 3500, rating: 5.0, image: AGRO_IMAGES.field, aiRecommended: true, description: "Análise completa + plano de ação IA" },
  { id: "mp6", name: "Seguro Agrícola Multirrisco", category: "Seguros", supplier: "AgroSeg", price: 28000, rating: 4.6, image: AGRO_IMAGES.farm, description: "Cobertura clima + produtividade" },
];

export const MOCK_DASHBOARD_STATS: AgroDashboardStats = {
  farmsCount: 3,
  monitoredAreaHa: 4370,
  estimatedProduction: 18500,
  sensorsOnline: 6,
  robotsActive: 4,
  dronesActive: 2,
  criticalAlerts: 2,
  operationalEfficiency: 87,
  costPerHectare: 4850,
  harvestForecast: 49440,
};

export const MOCK_TELEMETRY: RealtimeTelemetry = {
  temperature: 28.4,
  humidity: 65,
  soilPh: 6.1,
  soilMoisture: 38,
  irrigationLevel: 72,
  windSpeed: 12,
  luminosity: 85000,
  pestPresence: true,
  updatedAt: "2026-05-24T14:32:00Z",
};

export const MOCK_AI_RECOMMENDATIONS: AiAgroRecommendation[] = [
  { id: "rec1", tag: "Irrigação", title: "Irrigar Talhão B2 amanhã", description: "Umidade 28% · Sem chuva prevista · Economia 12%", action: "Programar", href: "/agro/clima" },
  { id: "rec2", tag: "Praga", title: "Pulverização preventiva B2", description: "Risco alto lagarta · SprayBot disponível", action: "Acionar robô", href: "/agro/robos" },
  { id: "rec3", tag: "Custo", title: "Reduzir R$45/ha operação", description: "Otimizar rotas robô + compra coletiva insumos", action: "Ver análise", href: "/agro/analises" },
  { id: "rec4", tag: "Rebanho", title: "Verificar boi #2103", description: "Queda atividade 42% · Isolar e veterinário", action: "Ver rebanho", href: "/agro/rebanho" },
];

export function getFarmById(id: string) {
  return MOCK_FARMS.find((f) => f.id === id);
}

export function getPlotsByFarm(farmId: string) {
  return MOCK_PLOTS.filter((p) => p.farmId === farmId);
}

export function getSensorsByFarm(farmId: string) {
  return MOCK_SENSORS.filter((s) => s.farmId === farmId);
}

export function getRobotsByFarm(farmId: string) {
  return MOCK_ROBOTS.filter((r) => r.farmId === farmId);
}

export function getDronesByFarm(farmId: string) {
  return MOCK_DRONES.filter((d) => d.farmId === farmId);
}

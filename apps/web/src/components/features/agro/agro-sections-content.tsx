"use client";

import { useEffect, useState } from "react";
import { RealtimeMapMock } from "./realtime-map-mock";
import { SensorCard } from "./sensor-card";
import { RobotCard } from "./robot-card";
import { DroneCard } from "./drone-card";
import { AgroStatCard } from "./agro-stat-card";
import { MLModelCard } from "./ml-model-card";
import { AutomationCard } from "./automation-card";
import { WeatherPanel } from "./weather-panel";
import { SoilPanel } from "./soil-panel";
import { LivestockPanel } from "./livestock-panel";
import { MachineCard } from "./machine-card";
import { AlertCenter } from "./alert-center";
import { AgroMarketplaceCard } from "./agro-marketplace-card";
import { ProductionChartMock } from "./production-chart-mock";
import { AIRecommendationPanel } from "./ai-recommendation-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgroStore } from "@/store/agro-store";
import { AI_QUICK_QUESTIONS } from "@/lib/agro/config";
import {
  fetchTelemetry, fetchSensors, fetchRobots, fetchDrones, fetchMLModels,
  fetchAutomations, fetchWeather, fetchSoil, fetchLivestock, fetchMachines,
  fetchAlerts, fetchStock, fetchPlanting, fetchHarvest, fetchAgroMarketplace,
  fetchAiRecommendations,
} from "@/lib/agro/api";
import type { RealtimeTelemetry, IoTSensor, AgroRobot, AgroDrone, MLModel, AutomationRule, WeatherForecast, SoilReading, LivestockAnimal, AgroMachine, AgroAlert, StockItem, PlantingRecord, HarvestRecord, AgroMarketplaceItem, AiAgroRecommendation } from "@/lib/agro/types";
import { formatAgroCurrency } from "@/lib/agro/config";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createAgroUnit, fetchAgroUnits, fetchIotDashboard } from "@/lib/iot/api";
import { Thermometer, Droplets, Wind, Sun, Bug, Gauge, Sparkles, Package } from "lucide-react";

export function AgroMonitoringContent() {
  const [telemetry, setTelemetry] = useState<RealtimeTelemetry | null>(null);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  useEffect(() => { Promise.all([fetchTelemetry(), fetchSensors()]).then(([t, s]) => { setTelemetry(t); setSensors(s); }); }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold">Monitoramento em tempo real</h1>
      <RealtimeMapMock />
      {telemetry && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AgroStatCard label="Temperatura" value={`${telemetry.temperature}°C`} icon={Thermometer} />
          <AgroStatCard label="Umidade ar" value={`${telemetry.humidity}%`} icon={Droplets} />
          <AgroStatCard label="Umidade solo" value={`${telemetry.soilMoisture}%`} icon={Gauge} />
          <AgroStatCard label="pH solo" value={telemetry.soilPh} icon={Gauge} />
          <AgroStatCard label="Irrigação" value={`${telemetry.irrigationLevel}%`} icon={Droplets} />
          <AgroStatCard label="Vento" value={`${telemetry.windSpeed} km/h`} icon={Wind} />
          <AgroStatCard label="Luminosidade" value={`${(telemetry.luminosity / 1000).toFixed(0)}k lux`} icon={Sun} />
          <AgroStatCard label="Pragas" value={telemetry.pestPresence ? "Detectada" : "Normal"} icon={Bug} variant={telemetry.pestPresence ? "critical" : "success"} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sensors.map(s => <SensorCard key={s.id} sensor={s} />)}</div>
    </div>
  );
}

export function AgroIotContent() {
  const { token } = useCurrentUser();
  const [units, setUnits] = useState<{ id: string; name: string; devices: unknown[]; sensors: unknown[] }[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; message: string; device?: { name: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", location: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      fetchSensors().then((s) => { setUnits([]); setLoading(false); });
      return;
    }
    Promise.all([fetchAgroUnits(token), fetchIotDashboard(token, {})])
      .then(([u, dash]) => {
        setUnits(u);
        setAlerts(dash.alerts);
      })
      .catch(() => fetchSensors().then(() => {}))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form.name.trim()) return;
    setBusy(true);
    try {
      await createAgroUnit(token, { name: form.name.trim(), location: form.location || undefined });
      setUnits(await fetchAgroUnits(token));
      setForm({ name: "", location: "" });
    } finally {
      setBusy(false);
    }
  }

  const deviceCount = units.reduce((n, u) => n + (u.devices?.length ?? 0) + (u.sensors?.length ?? 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="mb-2 font-display text-xl font-bold">Painel IoT AgroPet</h1>
      <p className="mb-4 text-sm text-ecopet-gray">{deviceCount} dispositivos · {units.length} unidade(s) rural(is)</p>

      {token && (
        <form onSubmit={handleCreateUnit} className="flex flex-wrap gap-2">
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Nome da fazenda/unidade" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Localização" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Button type="submit" size="sm" disabled={busy}>Cadastrar unidade</Button>
        </form>
      )}

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 p-3 text-sm space-y-1">
          {alerts.map((a) => <p key={a.id}><strong>{a.device?.name}</strong> — {a.message}</p>)}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ecopet-gray">Carregando...</p>
      ) : units.length === 0 ? (
        <p className="text-sm text-ecopet-gray">Cadastre uma unidade AgroPet para iniciar o monitoramento.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {units.map((u) => (
            <div key={u.id} className="rounded-xl border p-4">
              <h3 className="font-semibold">{u.name}</h3>
              <p className="text-xs text-ecopet-gray">{(u.devices as unknown[])?.length ?? 0} IoT · {(u.sensors as unknown[])?.length ?? 0} sensores</p>
            </div>
          ))}
        </div>
      )}

      {!token && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LegacyAgroSensors />
        </div>
      )}
    </div>
  );
}

function LegacyAgroSensors() {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  useEffect(() => { fetchSensors().then(setSensors); }, []);
  return <>{sensors.map((s) => <SensorCard key={s.id} sensor={s} />)}</>;
}

export function AgroRobotsContent() {
  const [robots, setRobots] = useState<AgroRobot[]>([]);
  useEffect(() => { fetchRobots().then(setRobots); }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold">Central de Robôs</h1>
      <RealtimeMapMock />
      <div className="rounded-xl border p-4 text-sm space-y-1">
        <p className="font-semibold mb-2">Fila de missões</p>
        <p>1. SprayBot Pro — Pulverização Talhão B2 (em andamento)</p>
        <p>2. AgroBot Plantio X1 — Plantio row 18-24 (agendado)</p>
        <p>3. FeedBot Pecuária — Distribuição ração lote C (pendente)</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{robots.map(r => <RobotCard key={r.id} robot={r} />)}</div>
    </div>
  );
}

export function AgroDronesContent() {
  const [drones, setDrones] = useState<AgroDrone[]>([]);
  useEffect(() => { fetchDrones().then(setDrones); }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold">Central de Drones</h1>
      <div className="grid gap-4 sm:grid-cols-2">{drones.map(d => <DroneCard key={d.id} drone={d} />)}</div>
      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 font-semibold">Plano de voo + análise NDVI</h2>
        <div className="grid h-48 place-items-center rounded-xl bg-gradient-to-br from-ecopet-green/20 to-ecopet-dark/20 text-sm">Grid NDVI simulado · 45 ha · Altitude 85m · 342 imagens</div>
      </section>
    </div>
  );
}

export function AgroAiContent() {
  const { setAiChatOpen, sendAiMessage } = useAgroStore();
  const [models, setModels] = useState<MLModel[]>([]);
  const [recs, setRecs] = useState<AiAgroRecommendation[]>([]);
  useEffect(() => { Promise.all([fetchMLModels(), fetchAiRecommendations()]).then(([m, r]) => { setModels(m); setRecs(r); }); }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold">IA Agro Inteligente</h1>
        <Button onClick={() => setAiChatOpen(true)}><Sparkles className="h-4 w-4" /> Abrir chat IA</Button>
      </div>
      <AIRecommendationPanel recommendations={recs} title="Recomendações automáticas" />
      <section>
        <h2 className="mb-4 font-semibold">Modelos de Machine Learning</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{models.map(m => <MLModelCard key={m.id} model={m} />)}</div>
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Perguntas rápidas</h2>
        <div className="flex flex-wrap gap-2">
          {AI_QUICK_QUESTIONS.map(q => (
            <button key={q} type="button" onClick={() => { setAiChatOpen(true); sendAiMessage(q); }} className="rounded-full border border-ecopet-green/30 px-4 py-2 text-sm hover:bg-ecopet-green/10">{q}</button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AgroAnalyticsContent() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  useEffect(() => { fetchAutomations().then(setAutomations); }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold">Relatórios e Analytics</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductionChartMock title="Produtividade por talhão (sc/ha)" data={[
          { label: "A1", value: 58 }, { label: "B2", value: 42 }, { label: "C3", value: 95 }, { label: "Norte", value: 55 },
        ].map(d => ({ ...d, color: "bg-ecopet-green" }))} />
        <ProductionChartMock title="ROI por safra (%)" data={[
          { label: "2022", value: 72 }, { label: "2023", value: 78 }, { label: "2024", value: 85 }, { label: "2025", value: 91 },
        ].map(d => ({ ...d, color: "bg-ecopet-yellow" }))} />
        <ProductionChartMock title="Economia de água (%)" data={[
          { label: "Jan", value: 8 }, { label: "Fev", value: 12 }, { label: "Mar", value: 15 }, { label: "Abr", value: 18 }, { label: "Mai", value: 22 },
        ].map(d => ({ ...d, color: "bg-blue-500" }))} />
        <ProductionChartMock title="Eficiência robôs (%)" data={[
          { label: "Plantio", value: 94 }, { label: "Spray", value: 89 }, { label: "Capina", value: 96 }, { label: "Feed", value: 91 },
        ].map(d => ({ ...d, color: "bg-ecopet-dark" }))} />
      </div>
      <section>
        <h2 className="mb-4 font-semibold">Automações operacionais</h2>
        <div className="grid gap-4 sm:grid-cols-2">{automations.map(a => <AutomationCard key={a.id} rule={a} />)}</div>
      </section>
    </div>
  );
}

export function AgroProductionContent() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold">Controle produtivo</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <AgroStatCard label="Produção estimada" value="18.500 t" icon={Package} variant="success" />
        <AgroStatCard label="Eficiência" value="87%" icon={Gauge} />
        <AgroStatCard label="Perdas estimadas" value="2.1%" icon={Bug} variant="warning" />
      </div>
      <ProductionChartMock />
    </div>
  );
}

export function AgroStockContent() {
  const [stock, setStock] = useState<StockItem[]>([]);
  useEffect(() => { fetchStock().then(setStock); }, []);
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Estoque e insumos</h1>
      <div className="space-y-3">
        {stock.map(s => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <Badge variant="default" className="mb-1">{s.category}</Badge>
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-sm text-ecopet-gray">{s.quantity.toLocaleString()} {s.unit} · Mín: {s.minStock}</p>
            </div>
            {s.aiAlert && <p className="text-xs text-amber-600">{s.aiAlert}</p>}
            {s.quantity < s.minStock && <Badge className="bg-red-500 text-white">Estoque baixo</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgroMachinesContent() {
  const [machines, setMachines] = useState<AgroMachine[]>([]);
  useEffect(() => { fetchMachines().then(setMachines); }, []);
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Máquinas e manutenção</h1>
      <div className="grid gap-4 sm:grid-cols-2">{machines.map(m => <MachineCard key={m.id} machine={m} />)}</div>
    </div>
  );
}

export function AgroWeatherContent() {
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  useEffect(() => { fetchWeather().then(setWeather); }, []);
  if (!weather) return null;
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Módulo climático</h1>
      <WeatherPanel weather={weather} />
    </div>
  );
}

export function AgroSoilContent() {
  const [readings, setReadings] = useState<SoilReading[]>([]);
  useEffect(() => { fetchSoil().then(setReadings); }, []);
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Painel de solo</h1>
      <SoilPanel readings={readings} />
    </div>
  );
}

export function AgroLivestockContent() {
  const [animals, setAnimals] = useState<LivestockAnimal[]>([]);
  useEffect(() => { fetchLivestock().then(setAnimals); }, []);
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Módulo pecuário</h1>
      <LivestockPanel animals={animals} />
    </div>
  );
}

export function AgroPlantingContent() {
  const [records, setRecords] = useState<PlantingRecord[]>([]);
  useEffect(() => { fetchPlanting().then(setRecords); }, []);
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Módulo de plantio</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {records.map(p => (
          <div key={p.id} className="rounded-2xl border p-4">
            <Badge className="mb-2">{p.crop}</Badge>
            <h3 className="font-semibold">{p.stage}</h3>
            <p className="text-sm text-ecopet-gray">{p.areaHa} ha · {p.seed}</p>
            <p className="mt-2 text-lg font-bold text-ecopet-green">{p.expectedYield} sc/ha previstos</p>
            <p className="mt-1 text-xs">Custo: {formatAgroCurrency(p.estimatedCost)}</p>
            <Badge className="mt-2" variant={p.risk === "Alto" ? "premium" : "default"}>Risco {p.risk}</Badge>
            <p className="mt-2 text-xs text-ecopet-green">{p.aiRecommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgroHarvestContent() {
  const [records, setRecords] = useState<HarvestRecord[]>([]);
  useEffect(() => { fetchHarvest().then(setRecords); }, []);
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Módulo de colheita</h1>
      <div className="space-y-4">
        {records.map(h => (
          <div key={h.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{h.crop} — {h.status}</h3>
              <Badge>{h.forecastDate}</Badge>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4 text-sm">
              <p>Produção: {h.expectedYield.toLocaleString()} sc</p>
              <p>Perdas: {h.estimatedLoss}%</p>
              <p>Máquinas: {h.machinesAvailable}</p>
              <p>Robôs: {h.robotsAvailable}</p>
            </div>
            <p className="mt-2 text-xs text-ecopet-gray">Logística: {h.logistics} · Armazenamento: {h.storage}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgroAlertsContent() {
  const [alerts, setAlerts] = useState<AgroAlert[]>([]);
  useEffect(() => { fetchAlerts().then(setAlerts); }, []);
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-bold">Central de alertas inteligentes</h1>
      <AlertCenter alerts={alerts} />
    </div>
  );
}

export function AgroMarketplaceContent() {
  const [items, setItems] = useState<AgroMarketplaceItem[]>([]);
  useEffect(() => { fetchAgroMarketplace().then(setItems); }, []);
  return (
    <div>
      <h1 className="mb-2 font-display text-xl font-bold">Marketplace Agro</h1>
      <p className="mb-6 text-sm text-ecopet-gray">Máquinas, sensores, drones, robôs, insumos, consultorias e crédito rural</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(i => <AgroMarketplaceCard key={i.id} item={i} />)}
      </div>
    </div>
  );
}

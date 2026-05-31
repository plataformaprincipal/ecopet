"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin, Radio, Bot, Plane, AlertTriangle, TrendingUp, Cpu, DollarSign,
  Wheat, Sparkles, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgroStatCard } from "./agro-stat-card";
import { AIRecommendationPanel } from "./ai-recommendation-panel";
import { AlertCenter } from "./alert-center";
import { RealtimeMapMock } from "./realtime-map-mock";
import { ProductionChartMock } from "./production-chart-mock";
import { RobotCard } from "./robot-card";
import { DroneCard } from "./drone-card";
import { WeatherPanel } from "./weather-panel";
import { useAgroStore } from "@/store/agro-store";
import {
  fetchDashboardStats, fetchAiRecommendations, fetchAlerts, fetchRobots,
  fetchDrones, fetchWeather, fetchTelemetry,
} from "@/lib/agro/api";
import type { AgroDashboardStats, AiAgroRecommendation, AgroAlert, AgroRobot, AgroDrone, WeatherForecast, RealtimeTelemetry } from "@/lib/agro/types";
import { formatAgroCurrency, formatHa } from "@/lib/agro/config";

export function AgroHomeContent() {
  const setAiChatOpen = useAgroStore((s) => s.setAiChatOpen);
  const [stats, setStats] = useState<AgroDashboardStats | null>(null);
  const [recs, setRecs] = useState<AiAgroRecommendation[]>([]);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchAiRecommendations()]).then(([s, r]) => {
      setStats(s);
      setRecs(r);
    });
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ecopet-dark via-[#1a4d32] to-ecopet-green p-6 text-white lg:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold text-ecopet-yellow">ECOPET Agro Inteligente</p>
          <h1 className="mt-2 font-display text-2xl font-bold lg:text-4xl">
            Agricultura de precisão com IA, IoT, robôs e drones
          </h1>
          <p className="mt-3 text-sm text-white/80">
            Plataforma integrada de monitoramento, automação, análise preditiva e gestão produtiva — conectada ao ecossistema ECOPET.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/agro/dashboard"><Button variant="secondary">Abrir Dashboard</Button></Link>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setAiChatOpen(true)}>
              <Sparkles className="h-4 w-4" /> Perguntar à IA Agro
            </Button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-ecopet-yellow/10 blur-3xl" />
      </section>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AgroStatCard label="Fazendas" value={stats.farmsCount} icon={MapPin} />
          <AgroStatCard label="Área monitorada" value={formatHa(stats.monitoredAreaHa)} icon={Radio} />
          <AgroStatCard label="Sensores online" value={stats.sensorsOnline} icon={Cpu} trend="De 8 total" />
          <AgroStatCard label="Robôs ativos" value={stats.robotsActive} icon={Bot} />
          <AgroStatCard label="Alertas críticos" value={stats.criticalAlerts} icon={AlertTriangle} variant="critical" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/agro/monitoramento", label: "Monitoramento", desc: "Tempo real", icon: Radio },
          { href: "/agro/robos", label: "Central de Robôs", desc: "6 unidades", icon: Bot },
          { href: "/agro/drones", label: "Drones", desc: "Mapeamento NDVI", icon: Plane },
          { href: "/agro/ia", label: "IA + ML", desc: "6 modelos ativos", icon: Sparkles },
          { href: "/agro/fazendas", label: "Fazendas", desc: "3 propriedades", icon: MapPin },
          { href: "/agro/plantio", label: "Plantio", desc: "Safra 2026", icon: Wheat },
          { href: "/agro/alertas", label: "Alertas", desc: "Central inteligente", icon: AlertTriangle },
          { href: "/agro/marketplace", label: "Marketplace Agro", desc: "Insumos e tech", icon: Zap },
        ].map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-ecopet-gray/10 p-4 transition-all hover:border-ecopet-green/30 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ecopet-green/10">
              <Icon className="h-6 w-6 text-ecopet-green" />
            </div>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-ecopet-gray">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {recs.length > 0 && <AIRecommendationPanel recommendations={recs} />}
    </div>
  );
}

export function AgroDashboardContent() {
  const [stats, setStats] = useState<AgroDashboardStats | null>(null);
  const [recs, setRecs] = useState<AiAgroRecommendation[]>([]);
  const [alerts, setAlerts] = useState<AgroAlert[]>([]);
  const [robots, setRobots] = useState<AgroRobot[]>([]);
  const [drones, setDrones] = useState<AgroDrone[]>([]);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [telemetry, setTelemetry] = useState<RealtimeTelemetry | null>(null);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(), fetchAiRecommendations(), fetchAlerts(),
      fetchRobots(), fetchDrones(), fetchWeather(), fetchTelemetry(),
    ]).then(([s, r, a, rb, dr, w, t]) => {
      setStats(s); setRecs(r); setAlerts(a); setRobots(rb); setDrones(dr); setWeather(w); setTelemetry(t);
    });
  }, []);

  if (!stats) return <div className="animate-pulse h-96 rounded-2xl bg-ecopet-gray/10" />;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AgroStatCard label="Fazendas cadastradas" value={stats.farmsCount} icon={MapPin} />
        <AgroStatCard label="Área monitorada" value={formatHa(stats.monitoredAreaHa)} icon={Radio} />
        <AgroStatCard label="Produção estimada" value={`${(stats.estimatedProduction / 1000).toFixed(1)}k t`} icon={TrendingUp} trend="+8% vs safra anterior" variant="success" />
        <AgroStatCard label="Sensores online" value={`${stats.sensorsOnline}/8`} icon={Cpu} />
        <AgroStatCard label="Robôs ativos" value={stats.robotsActive} icon={Bot} />
        <AgroStatCard label="Drones ativos" value={stats.dronesActive} icon={Plane} />
        <AgroStatCard label="Alertas críticos" value={stats.criticalAlerts} icon={AlertTriangle} variant="critical" />
        <AgroStatCard label="Eficiência operacional" value={`${stats.operationalEfficiency}%`} icon={Zap} variant="success" />
        <AgroStatCard label="Custo/hectare" value={formatAgroCurrency(stats.costPerHectare)} icon={DollarSign} />
        <AgroStatCard label="Previsão safra" value={`${stats.harvestForecast.toLocaleString()} sc`} icon={Wheat} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RealtimeMapMock telemetry={telemetry ?? undefined} />
        {weather && <div className="rounded-2xl border border-ecopet-gray/10 p-4"><h3 className="mb-4 font-semibold">Clima ao vivo</h3><WeatherPanel weather={weather} /></div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProductionChartMock title="Produtividade por mês (sc/ha)" />
        <ProductionChartMock title="Custo por hectare (R$)" data={[
          { label: "Jan", value: 4200 }, { label: "Fev", value: 4350 }, { label: "Mar", value: 4100 },
          { label: "Abr", value: 4600 }, { label: "Mai", value: 4850 }, { label: "Jun", value: 4700 },
        ].map(d => ({ ...d, color: "bg-ecopet-dark" }))} />
      </div>

      <AIRecommendationPanel recommendations={recs} />

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">Alertas críticos</h2>
        <AlertCenter alerts={alerts.filter(a => a.priority === "critical" || a.priority === "high").slice(0, 4)} compact />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-semibold">Robôs em operação</h2>
          <div className="space-y-3">{robots.filter(r => r.status === "active").slice(0, 2).map(r => <RobotCard key={r.id} robot={r} />)}</div>
        </section>
        <section>
          <h2 className="mb-4 font-semibold">Drones em voo</h2>
          <div className="space-y-3">{drones.filter(d => d.status === "flying").map(d => <DroneCard key={d.id} drone={d} />)}</div>
        </section>
      </div>
    </div>
  );
}

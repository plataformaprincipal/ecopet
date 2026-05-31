"use client";

import { MapPin, Cpu, Bot, Plane, Beef, Tractor, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MOCK_PLOTS, MOCK_SENSORS, MOCK_ROBOTS, MOCK_DRONES, MOCK_LIVESTOCK } from "@/lib/agro/mock-data";
import type { RealtimeTelemetry } from "@/lib/agro/types";

interface RealtimeMapMockProps {
  telemetry?: RealtimeTelemetry;
}

export function RealtimeMapMock({ telemetry }: RealtimeMapMockProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ecopet-green/20 bg-gradient-to-br from-ecopet-dark/90 to-ecopet-green/80 p-4 text-white min-h-[320px] lg:min-h-[400px]">
      <div className="absolute inset-0 opacity-20">
        <svg viewBox="0 0 400 300" className="h-full w-full">
          <rect x="20" y="20" width="160" height="120" fill="#2E7D4F" opacity="0.6" rx="4" />
          <rect x="200" y="30" width="180" height="100" fill="#F5C800" opacity="0.4" rx="4" />
          <rect x="30" y="160" width="140" height="110" fill="#1A3A2A" opacity="0.5" rx="4" />
          <rect x="190" y="150" width="190" height="130" fill="#2E7D4F" opacity="0.3" rx="4" />
        </svg>
      </div>
      <div className="relative z-10">
        <h3 className="font-display text-lg font-bold">Mapa em tempo real</h3>
        <p className="text-sm text-white/70">Fazenda ECOPET Verde — Monitoramento ativo</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MOCK_PLOTS.slice(0, 3).map((p) => (
            <div key={p.id} className="rounded-lg bg-white/10 p-2 text-xs backdrop-blur">
              <MapPin className="h-3 w-3" /> {p.name}
              <Badge className="mt-1 text-[9px]" variant={p.risk === "high" ? "premium" : "default"}>{p.crop} · NDVI {p.ndvi}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"><Cpu className="h-3 w-3" /> {MOCK_SENSORS.filter(s => s.status === "online").length} sensores</span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"><Bot className="h-3 w-3" /> {MOCK_ROBOTS.filter(r => r.status === "active").length} robôs</span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"><Plane className="h-3 w-3" /> {MOCK_DRONES.filter(d => d.status === "flying").length} drones</span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"><Beef className="h-3 w-3" /> {MOCK_LIVESTOCK.length} animais</span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"><Tractor className="h-3 w-3" /> 3 máquinas</span>
          {telemetry?.pestPresence && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/80 px-2 py-1"><AlertTriangle className="h-3 w-3" /> Praga detectada</span>
          )}
        </div>
        {telemetry && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <div className="rounded-lg bg-white/10 p-2">{telemetry.temperature}°C</div>
            <div className="rounded-lg bg-white/10 p-2">UR {telemetry.humidity}%</div>
            <div className="rounded-lg bg-white/10 p-2">Solo {telemetry.soilMoisture}%</div>
            <div className="rounded-lg bg-white/10 p-2">pH {telemetry.soilPh}</div>
          </div>
        )}
      </div>
    </div>
  );
}

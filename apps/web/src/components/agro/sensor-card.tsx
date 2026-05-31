"use client";

import { Wifi, WifiOff, Battery, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IoTSensor } from "@/lib/agro/types";

const statusConfig = {
  online: { icon: Wifi, color: "text-ecopet-green", label: "Online" },
  offline: { icon: WifiOff, color: "text-red-500", label: "Offline" },
  warning: { icon: AlertTriangle, color: "text-amber-500", label: "Alerta" },
  maintenance: { icon: AlertTriangle, color: "text-ecopet-gray", label: "Manutenção" },
};

interface SensorCardProps {
  sensor: IoTSensor;
}

export function SensorCard({ sensor }: SensorCardProps) {
  const cfg = statusConfig[sensor.status];
  const StatusIcon = cfg.icon;

  return (
    <article className="rounded-2xl border border-ecopet-gray/10 bg-white p-4 dark:bg-white/5">
      <div className="flex items-start justify-between">
        <div>
          <Badge variant="default" className="mb-2 text-[10px]">{sensor.type}</Badge>
          <h3 className="font-semibold">{sensor.name}</h3>
          <p className="text-xs text-ecopet-gray">{sensor.location}</p>
        </div>
        <StatusIcon className={cn("h-5 w-5", cfg.color)} />
      </div>
      <p className="mt-3 text-sm font-medium">{sensor.lastReading}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-ecopet-gray">
        <span className="flex items-center gap-1"><Battery className="h-3 w-3" /> {sensor.battery}%</span>
        <span>{cfg.label}</span>
        {sensor.alerts > 0 && <Badge className="bg-red-500 text-white">{sensor.alerts} alerta(s)</Badge>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(sensor.data).slice(0, 3).map(([k, v]) => (
          <span key={k} className="rounded-lg bg-ecopet-gray/10 px-2 py-1 text-[10px]">{k}: {v}</span>
        ))}
      </div>
    </article>
  );
}

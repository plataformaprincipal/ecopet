"use client";

import { Plane, Battery, ArrowUp, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AgroDrone } from "@/lib/agro/types";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  flying: "Em voo", idle: "Standby", charging: "Carregando", maintenance: "Manutenção",
};

interface DroneCardProps {
  drone: AgroDrone;
}

export function DroneCard({ drone }: DroneCardProps) {
  return (
    <article className="rounded-2xl border border-ecopet-gray/10 bg-white p-4 dark:bg-white/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
            <Plane className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h3 className="font-semibold">{drone.name}</h3>
            <Badge className={cn("mt-1", drone.status === "flying" ? "bg-sky-500 text-white" : "")}>{statusLabels[drone.status]}</Badge>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm"><strong>Missão:</strong> {drone.mission}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <span className="flex items-center gap-1 rounded-lg bg-ecopet-gray/10 p-2"><Battery className="h-3 w-3" /> {drone.battery}%</span>
        <span className="flex items-center gap-1 rounded-lg bg-ecopet-gray/10 p-2"><ArrowUp className="h-3 w-3" /> {drone.altitude}m</span>
        <span className="rounded-lg bg-ecopet-gray/10 p-2">{drone.areaCoveredHa} ha cobertos</span>
        <span className="flex items-center gap-1 rounded-lg bg-ecopet-gray/10 p-2"><ImageIcon className="h-3 w-3" /> {drone.imagesCaptured} imgs</span>
      </div>
      {drone.aiAlert && (
        <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">IA: {drone.aiAlert}</p>
      )}
    </article>
  );
}

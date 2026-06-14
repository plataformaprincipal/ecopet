"use client";

import { Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SoilReading } from "@/lib/agro/types";

interface SoilPanelProps {
  readings: SoilReading[];
}

export function SoilPanel({ readings }: SoilPanelProps) {
  return (
    <div className="space-y-4">
      {readings.map((s) => (
        <div key={s.id} className="rounded-2xl border border-ecopet-gray/10 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><Layers className="h-4 w-4 text-ecopet-green" /> Talhão {s.plotId.replace("plot", "")}</h3>
            <Badge variant="default">pH {s.ph}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <div className="rounded-lg bg-ecopet-gray/10 p-2"><span className="text-ecopet-gray">N</span> <strong>{s.nitrogen} ppm</strong></div>
            <div className="rounded-lg bg-ecopet-gray/10 p-2"><span className="text-ecopet-gray">P</span> <strong>{s.phosphorus} ppm</strong></div>
            <div className="rounded-lg bg-ecopet-gray/10 p-2"><span className="text-ecopet-gray">K</span> <strong>{s.potassium} ppm</strong></div>
            <div className="rounded-lg bg-ecopet-gray/10 p-2"><span className="text-ecopet-gray">Umidade</span> <strong>{s.moisture}%</strong></div>
            <div className="rounded-lg bg-ecopet-gray/10 p-2"><span className="text-ecopet-gray">Compactação</span> <strong>{s.compaction} MPa</strong></div>
            <div className="rounded-lg bg-ecopet-gray/10 p-2"><span className="text-ecopet-gray">Mat. org.</span> <strong>{s.organicMatter}%</strong></div>
            <div className="rounded-lg bg-ecopet-gray/10 p-2"><span className="text-ecopet-gray">Salinidade</span> <strong>{s.salinity} dS/m</strong></div>
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-ecopet-green/5 p-3 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-ecopet-yellow" />
            {s.aiRecommendation}
          </p>
        </div>
      ))}
    </div>
  );
}

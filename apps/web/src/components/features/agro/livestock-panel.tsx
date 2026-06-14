"use client";

import { Beef, Activity, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LivestockAnimal } from "@/lib/agro/types";
import { cn } from "@/lib/utils";

const healthColors = { good: "bg-ecopet-green", warning: "bg-amber-500", critical: "bg-red-500" };

interface LivestockPanelProps {
  animals: LivestockAnimal[];
}

export function LivestockPanel({ animals }: LivestockPanelProps) {
  return (
    <div className="space-y-3">
      {animals.map((a) => (
        <div key={a.id} className="flex gap-4 rounded-2xl border border-ecopet-gray/10 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ecopet-dark/10">
            <Beef className="h-6 w-6 text-ecopet-dark dark:text-ecopet-green" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{a.tag}</h3>
              <Badge className={cn("text-white", healthColors[a.health])}>{a.health === "good" ? "Saudável" : a.health === "warning" ? "Atenção" : "Crítico"}</Badge>
            </div>
            <p className="text-xs text-ecopet-gray">{a.breed} · {a.weight} kg</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-ecopet-gray">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.location}</span>
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Atividade {a.activity}%</span>
            </div>
            {a.aiInsight && (
              <p className="mt-2 flex items-start gap-1 text-xs text-amber-600"><Sparkles className="h-3 w-3 shrink-0" /> {a.aiInsight}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

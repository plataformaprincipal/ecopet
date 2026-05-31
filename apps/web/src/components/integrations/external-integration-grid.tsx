"use client";

import { useState } from "react";
import { IntegrationCard } from "./integration-card";
import { INTEGRATION_CATEGORIES } from "@/lib/integrations/config";
import type { ExternalIntegration, IntegrationCategory } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

interface ExternalIntegrationGridProps {
  integrations: ExternalIntegration[];
}

export function ExternalIntegrationGrid({ integrations }: ExternalIntegrationGridProps) {
  const [filter, setFilter] = useState<IntegrationCategory | "all">("all");
  const filtered = filter === "all" ? integrations : integrations.filter((i) => i.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button type="button" onClick={() => setFilter("all")} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", filter === "all" ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}>
          Todas ({integrations.length})
        </button>
        {INTEGRATION_CATEGORIES.filter((c) => integrations.some((i) => i.category === c.id)).map((cat) => (
          <button key={cat.id} type="button" onClick={() => setFilter(cat.id)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", filter === cat.id ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}>
            {cat.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((int) => (
          <IntegrationCard key={int.id} integration={int} />
        ))}
      </div>
    </div>
  );
}

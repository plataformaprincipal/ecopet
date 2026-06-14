"use client";

import { ArrowRight, Zap } from "lucide-react";
import { StatusBadge } from "./shared/status-badge";
import { RiskBadge } from "./shared/risk-badge";
import type { InternalIntegration } from "@/lib/integrations/types";

interface InternalIntegrationMapProps {
  integrations: InternalIntegration[];
}

export function InternalIntegrationMap({ integrations }: InternalIntegrationMapProps) {
  return (
    <div className="space-y-3">
      {integrations.map((int) => (
        <div key={int.id} className="card-premium flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-lg bg-ecopet-dark px-2 py-1 text-xs font-semibold text-white">{int.origin}</span>
              <ArrowRight className="h-4 w-4 text-ecopet-green" />
              <span className="rounded-lg bg-ecopet-green/10 px-2 py-1 text-xs font-semibold text-ecopet-green">{int.destination}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={int.status} />
            <RiskBadge level={int.riskLevel} />
            <span className="flex items-center gap-1 caption-text"><Zap className="h-3 w-3" /> {int.activeAutomations} automações</span>
          </div>
          <div className="w-full sm:w-auto">
            <p className="caption-text">Dados: {int.sharedData.join(" · ")}</p>
            <p className="caption-text">Permissões: {int.permissions.join(", ")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

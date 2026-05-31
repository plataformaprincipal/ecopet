"use client";

import { useState } from "react";
import { Plug, Settings, FileText, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./shared/status-badge";
import { RiskBadge } from "./shared/risk-badge";
import { IntegrationConfigPanel } from "./integration-config-panel";
import type { ExternalIntegration } from "@/lib/integrations/types";
import { INTEGRATION_CATEGORIES } from "@/lib/integrations/config";

interface IntegrationCardProps {
  integration: ExternalIntegration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const [showConfig, setShowConfig] = useState(false);
  const categoryLabel = INTEGRATION_CATEGORIES.find((c) => c.id === integration.category)?.label ?? integration.category;

  return (
    <>
      <div className="card-premium flex flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ecopet-green/10">
              <Plug className="h-5 w-5 text-ecopet-green" />
            </div>
            <div>
              <h3 className="font-semibold">{integration.name}</h3>
              <p className="caption-text">{integration.provider} · {categoryLabel}</p>
            </div>
          </div>
          <StatusBadge status={integration.status} />
        </div>

        <p className="mt-3 text-sm text-ecopet-gray dark:text-white/70">{integration.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <RiskBadge level={integration.riskLevel} />
          {integration.lastSync && <span className="caption-text">Sync: {integration.lastSync}</span>}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {integration.permissions.slice(0, 3).map((p) => (
            <span key={p} className="rounded-md bg-ecopet-gray/5 px-2 py-0.5 text-[10px] dark:bg-white/5">{p}</span>
          ))}
        </div>

        {integration.syncedData.length > 0 && (
          <p className="mt-2 caption-text">Dados: {integration.syncedData.join(", ")}</p>
        )}
        <p className="caption-text">Responsável: {integration.responsible}</p>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-ecopet-gray/10 pt-3 dark:border-white/10">
          {integration.status === "connected" ? (
            <>
              <Button variant="outline" size="sm"><Unlink className="h-3 w-3" /> Desconectar</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(true)}><Settings className="h-3 w-3" /> Configurar</Button>
            </>
          ) : (
            <Button size="sm"><Link2 className="h-3 w-3" /> Conectar</Button>
          )}
          <Button variant="ghost" size="sm"><FileText className="h-3 w-3" /> Logs</Button>
        </div>
      </div>

      {showConfig && (
        <IntegrationConfigPanel integration={integration} onClose={() => setShowConfig(false)} />
      )}
    </>
  );
}

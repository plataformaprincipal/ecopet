"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExternalIntegration } from "@/lib/integrations/types";
import { INTEGRATION_CATEGORIES } from "@/lib/integrations/config";

interface IntegrationConfigPanelProps {
  integration: ExternalIntegration;
  onClose: () => void;
}

export function IntegrationConfigPanel({ integration, onClose }: IntegrationConfigPanelProps) {
  const categoryLabel = INTEGRATION_CATEGORIES.find((c) => c.id === integration.category)?.label;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl dark:bg-ecopet-dark-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-3">Configurar — {integration.name}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-semibold">Provedor</label><Input defaultValue={integration.provider} className="mt-1" readOnly /></div>
          <div><label className="text-sm font-semibold">Tipo</label><Input defaultValue={categoryLabel} className="mt-1" readOnly /></div>
          <div><label className="text-sm font-semibold">API Key (mock)</label><Input defaultValue="ecopet_••••••••••••••••" className="mt-1 font-mono text-xs" type="password" /></div>
          <div><label className="text-sm font-semibold">Frequência de sync</label>
            <select className="mt-1 flex h-11 w-full rounded-xl border px-4 text-sm dark:bg-ecopet-dark-card">
              <option>Tempo real</option><option>A cada 5 min</option><option>A cada 15 min</option><option>A cada 1h</option><option>Diário</option>
            </select>
          </div>
          <div><label className="text-sm font-semibold">Responsável</label><Input defaultValue={integration.responsible} className="mt-1" /></div>
          <div className="rounded-xl border border-ecopet-green/20 bg-ecopet-green/5 p-3 text-sm">
            <p className="font-semibold text-ecopet-green">Teste de conexão</p>
            <p className="caption-text mt-1">Última sync: {integration.lastSync ?? "Nunca"}</p>
            <Button variant="outline" size="sm" className="mt-2">Testar conexão</Button>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">Salvar</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

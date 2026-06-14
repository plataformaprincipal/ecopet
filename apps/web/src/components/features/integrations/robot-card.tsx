"use client";

import { useState } from "react";
import { Bot, Play, Pause, Settings, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./shared/status-badge";
import { RiskBadge } from "./shared/risk-badge";
import { RobotConfigPanel } from "./robot-config-panel";
import type { Robot24h } from "@/lib/integrations/types";
import { AUTONOMY_LABELS } from "@/lib/integrations/config";
import { AI_STRUCTURAL_NOTICE, FEATURE_UNAVAILABLE_DEFAULT } from "@/components/ui/feature-unavailable";

interface RobotCardProps {
  robot: Robot24h;
}

export function RobotCard({ robot }: RobotCardProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleToggle = () => {
    setStatusMsg(
      robot.status === "active"
        ? "Pausa registrada localmente. Controle central disponível no painel Gestor."
        : "Ativação registrada localmente. Controle central disponível no painel Gestor."
    );
  };

  const handleHistory = () => {
    setStatusMsg(FEATURE_UNAVAILABLE_DEFAULT);
  };

  return (
    <>
      <div className="card-premium flex flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ecopet-yellow/20">
              <Bot className="h-5 w-5 text-ecopet-dark dark:text-ecopet-yellow" />
            </div>
            <div>
              <h3 className="font-semibold">{robot.name}</h3>
              <p className="caption-text">{robot.area}</p>
            </div>
          </div>
          <StatusBadge status={robot.status} />
        </div>

        <p className="mt-2 text-sm text-ecopet-gray dark:text-white/70">{robot.function}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-ecopet-gray/5 p-2 dark:bg-white/5">
            <span className="text-ecopet-gray">Frequência</span>
            <p className="font-semibold">{robot.frequency}</p>
          </div>
          <div className="rounded-lg bg-ecopet-gray/5 p-2 dark:bg-white/5">
            <span className="text-ecopet-gray">Ações</span>
            <p className="font-semibold">{robot.actionsExecuted}</p>
          </div>
          <div className="rounded-lg bg-ecopet-gray/5 p-2 dark:bg-white/5">
            <span className="text-ecopet-gray">Última exec.</span>
            <p className="font-semibold">{robot.lastRun}</p>
          </div>
          <div className="rounded-lg bg-ecopet-gray/5 p-2 dark:bg-white/5">
            <span className="text-ecopet-gray">Próxima</span>
            <p className="font-semibold">{robot.nextRun}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <RiskBadge level={robot.operationalRisk} />
          <span className="rounded-full bg-ecopet-green/10 px-2 py-0.5 text-[10px] font-medium text-ecopet-green">
            {AUTONOMY_LABELS[robot.autonomy]}
          </span>
          {robot.alerts > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              {robot.alerts} alerta(s)
            </span>
          )}
        </div>

        {robot.aiRecommendation && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-ecopet-yellow/5 border border-ecopet-yellow/20 p-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-ecopet-yellow mt-0.5" />
            <span>{robot.aiRecommendation}</span>
          </div>
        )}

        <p className="mt-2 text-[10px] text-ecopet-gray dark:text-white/50">{AI_STRUCTURAL_NOTICE}</p>

        {statusMsg && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-200" role="status">{statusMsg}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-ecopet-gray/10 pt-3 dark:border-white/10">
          {robot.status === "active" ? (
            <Button variant="outline" size="sm" type="button" onClick={handleToggle} aria-label={`Pausar ${robot.name}`}>
              <Pause className="h-3 w-3" /> Pausar
            </Button>
          ) : (
            <Button size="sm" type="button" onClick={handleToggle} aria-label={`Ativar ${robot.name}`}>
              <Play className="h-3 w-3" /> Ativar
            </Button>
          )}
          <Button variant="ghost" size="sm" type="button" onClick={() => setShowConfig(true)} aria-label={`Configurar ${robot.name}`}>
            <Settings className="h-3 w-3" /> Configurar
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={handleHistory} aria-label={`Histórico de ${robot.name}`}>
            <History className="h-3 w-3" /> Histórico
          </Button>
        </div>
      </div>

      {showConfig && <RobotConfigPanel robot={robot} onClose={() => setShowConfig(false)} />}
    </>
  );
}

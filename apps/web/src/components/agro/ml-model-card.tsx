"use client";

import { Brain, CheckCircle2, Loader2, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ML_MODEL_LABELS } from "@/lib/agro/config";
import type { MLModel } from "@/lib/agro/types";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: { icon: CheckCircle2, label: "Ativo", color: "text-ecopet-green" },
  training: { icon: Loader2, label: "Treinando", color: "text-blue-500" },
  validating: { icon: FlaskConical, label: "Em validação", color: "text-amber-500" },
};

interface MLModelCardProps {
  model: MLModel;
}

export function MLModelCard({ model }: MLModelCardProps) {
  const cfg = statusConfig[model.status];
  const StatusIcon = cfg.icon;

  return (
    <article className="rounded-2xl border border-ecopet-gray/10 p-4 dark:bg-white/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-600" />
          <div>
            <h3 className="font-semibold">{model.name}</h3>
            <p className="text-xs text-ecopet-gray">{ML_MODEL_LABELS[model.type] ?? model.type}</p>
          </div>
        </div>
        <StatusIcon className={cn("h-5 w-5", cfg.color, model.status === "training" && "animate-spin")} />
      </div>
      <p className="mt-2 text-sm text-ecopet-gray">{model.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-ecopet-green">{model.accuracy}%</p>
          <p className="text-[10px] text-ecopet-gray">Precisão estimada</p>
        </div>
        <Badge variant="default">{cfg.label}</Badge>
      </div>
      <p className="mt-2 text-[10px] text-ecopet-gray">Atualizado: {model.lastUpdated}</p>
    </article>
  );
}

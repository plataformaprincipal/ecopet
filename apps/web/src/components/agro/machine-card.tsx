"use client";

import { Tractor, Fuel, Wrench, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatAgroCurrency } from "@/lib/agro/config";
import type { AgroMachine } from "@/lib/agro/types";
import { cn } from "@/lib/utils";

interface MachineCardProps {
  machine: AgroMachine;
}

export function MachineCard({ machine }: MachineCardProps) {
  return (
    <article className="rounded-2xl border border-ecopet-gray/10 p-4 dark:bg-white/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Tractor className="h-8 w-8 text-ecopet-green" />
          <div>
            <h3 className="font-semibold">{machine.name}</h3>
            <p className="text-xs text-ecopet-gray">{machine.type} · {machine.operator}</p>
          </div>
        </div>
        <Badge className={cn(machine.status === "online" ? "bg-ecopet-green text-white" : machine.status === "warning" ? "bg-amber-500 text-white" : "bg-red-500 text-white")}>
          {machine.status}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <span className="flex items-center gap-1 rounded-lg bg-ecopet-gray/10 p-2"><Fuel className="h-3 w-3" /> {machine.fuel}%</span>
        <span className="rounded-lg bg-ecopet-gray/10 p-2">{machine.hoursUsed}h uso</span>
        <span className="flex items-center gap-1 rounded-lg bg-ecopet-gray/10 p-2"><Wrench className="h-3 w-3" /> {machine.nextMaintenance}</span>
        <span className={cn("rounded-lg p-2", machine.failureRisk > 50 ? "bg-red-500/10 text-red-600" : "bg-ecopet-gray/10")}>
          <AlertTriangle className="inline h-3 w-3" /> Risco {machine.failureRisk}%
        </span>
      </div>
      <p className="mt-2 text-sm text-ecopet-gray">Custo operacional: {formatAgroCurrency(machine.operationalCost)}/dia</p>
      {machine.failureRisk > 50 && (
        <p className="mt-2 text-xs text-red-600">IA: Manutenção preditiva recomendada</p>
      )}
    </article>
  );
}

"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Robot24h } from "@/lib/integrations/types";
import { AUTONOMY_LABELS } from "@/lib/integrations/config";

interface RobotConfigPanelProps {
  robot: Robot24h;
  onClose: () => void;
}

export function RobotConfigPanel({ robot, onClose }: RobotConfigPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl dark:bg-ecopet-dark-card max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-3">Configurar — {robot.name}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-semibold">Área</label><Input defaultValue={robot.area} className="mt-1" readOnly /></div>
          <div><label className="text-sm font-semibold">Nível de autonomia</label>
            <select className="mt-1 flex h-11 w-full rounded-xl border px-4 text-sm dark:bg-ecopet-dark-card" defaultValue={robot.autonomy}>
              {Object.entries(AUTONOMY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className="text-sm font-semibold">Frequência</label><Input defaultValue={robot.frequency} className="mt-1" /></div>
          <div><label className="text-sm font-semibold">Canais de alerta</label>
            <div className="mt-2 space-y-2">
              {["Push", "E-mail", "WhatsApp", "Dashboard"].map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-ecopet-green" /> {c}</label>
              ))}
            </div>
          </div>
          <div><label className="text-sm font-semibold">Ações permitidas</label>
            <div className="mt-2 space-y-2">
              {["Monitorar", "Sugerir", "Notificar", "Executar com aprovação", "Executar automático"].map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={a !== "Executar automático"} className="accent-ecopet-green" /> {a}</label>
              ))}
            </div>
          </div>
          <div><label className="text-sm font-semibold">Horário de atuação</label>
            <select className="mt-1 flex h-11 w-full rounded-xl border px-4 text-sm dark:bg-ecopet-dark-card">
              <option>24 horas</option><option>Horário comercial</option><option>Personalizado</option>
            </select>
          </div>
          <div><label className="text-sm font-semibold">Limite de risco</label>
            <select className="mt-1 flex h-11 w-full rounded-xl border px-4 text-sm dark:bg-ecopet-dark-card" defaultValue={robot.operationalRisk}>
              <option value="low">Baixo — apenas alertas</option>
              <option value="medium">Médio — ações com aprovação</option>
              <option value="high">Alto — automação completa</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1">Salvar configuração</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

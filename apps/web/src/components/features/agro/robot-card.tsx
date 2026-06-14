"use client";

import { Bot, Battery, MapPin, Play, Pause, Home, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgroStore } from "@/store/agro-store";
import type { AgroRobot } from "@/lib/agro/types";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  active: "Em operação", idle: "Ocioso", charging: "Carregando", paused: "Pausado", error: "Erro",
};

interface RobotCardProps {
  robot: AgroRobot;
}

export function RobotCard({ robot }: RobotCardProps) {
  const { sendRobotCommand, robotCommands } = useAgroStore();
  const lastCmd = robotCommands[robot.id];

  return (
    <article className="rounded-2xl border border-ecopet-gray/10 bg-white p-4 dark:bg-white/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ecopet-dark/10">
            <Bot className="h-6 w-6 text-ecopet-dark dark:text-ecopet-green" />
          </div>
          <div>
            <h3 className="font-semibold">{robot.name}</h3>
            <p className="text-xs text-ecopet-gray">{robot.type}</p>
          </div>
        </div>
        <Badge className={cn(robot.status === "active" ? "bg-ecopet-green text-white" : "bg-ecopet-gray/20")}>
          {statusLabels[robot.status]}
        </Badge>
      </div>
      <p className="mt-3 text-sm"><strong>Missão:</strong> {robot.mission}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-ecopet-gray"><MapPin className="h-3 w-3" /> {robot.location}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-ecopet-gray/10 p-2"><Battery className="mx-auto h-4 w-4" />{robot.battery}%</div>
        <div className="rounded-lg bg-ecopet-gray/10 p-2">{robot.speed} km/h</div>
        <div className="rounded-lg bg-ecopet-gray/10 p-2">{robot.areaCoveredHa} ha</div>
      </div>
      {robot.alerts.length > 0 && (
        <p className="mt-2 text-xs text-amber-600">{robot.alerts.join(" · ")}</p>
      )}
      {lastCmd && <p className="mt-2 text-xs text-ecopet-green">Último comando: {lastCmd}</p>}
      <div className="mt-3 flex flex-wrap gap-1">
        <Button size="sm" variant="outline" className="px-2" onClick={() => sendRobotCommand(robot.id, "Iniciar")}><Play className="h-3 w-3" /></Button>
        <Button size="sm" variant="outline" className="px-2" onClick={() => sendRobotCommand(robot.id, "Pausar")}><Pause className="h-3 w-3" /></Button>
        <Button size="sm" variant="outline" className="px-2" onClick={() => sendRobotCommand(robot.id, "Retornar à base")}><Home className="h-3 w-3" /></Button>
        <Button size="sm" variant="outline" className="px-2" onClick={() => sendRobotCommand(robot.id, "Agendar missão")}><Calendar className="h-3 w-3" /></Button>
      </div>
    </article>
  );
}

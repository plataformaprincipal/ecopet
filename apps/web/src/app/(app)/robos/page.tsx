"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Play, Pause, Loader2, FileText } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchRobots, toggleRobot, runRobot, type RobotDto } from "@/lib/robots/api";
import { cn } from "@/lib/utils";

export default function RobotsPage() {
  const { user, token } = useCurrentUser();
  const [robots, setRobots] = useState<RobotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setRobots(await fetchRobots(token));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleToggle(robot: RobotDto) {
    if (!token) return;
    setBusy(robot.id);
    try {
      await toggleRobot(token, robot.id, !robot.isActive);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  async function handleRun(robot: RobotDto) {
    if (!token) return;
    setBusy(`run-${robot.id}`);
    try {
      const result = await runRobot(token, robot.id);
      setReport(result.summary);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  if (!user || !token) {
    return (
      <>
        <AppHeader title="Central de Robôs" />
        <main className="mx-auto max-w-5xl flex-1 p-6 text-center text-sm">Entre para acessar automações do seu perfil.</main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Central de Robôs" />
      <main className="mx-auto max-w-5xl flex-1 space-y-6 p-4 lg:p-6">
        <div>
          <h1 className="heading-2">Central de Robôs</h1>
          <p className="secondary-text">Automações estruturais do perfil {user.role?.toLowerCase()}</p>
        </div>

        <div className="rounded-xl border bg-ecopet-gray/5 px-4 py-3 text-sm">
          Automações estruturais ativas. {!robots.some((r) => r.aiPowered) && "IA real não configurada — robôs operam com regras programadas."}
        </div>

        {report && (
          <Card className="border-ecopet-green/30">
            <CardContent className="p-4 flex gap-2 text-sm"><FileText className="h-4 w-4 shrink-0 text-ecopet-green" />{report}</CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-ecopet-green" /></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {robots.map((robot) => (
              <Card key={robot.id} className="card-premium">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-ecopet-green" />
                      <div>
                        <h3 className="font-semibold text-sm">{robot.name}</h3>
                        <p className="text-xs text-ecopet-gray">{robot.description}</p>
                      </div>
                    </div>
                    <Badge className={cn(robot.isActive ? "bg-ecopet-green text-white" : "bg-ecopet-gray/20")}>
                      {robot.isActive ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-ecopet-gray">
                    <span>Gatilho: {robot.trigger}</span>
                    <span>Ação: {robot.action}</span>
                    <span>Última exec.: {robot.lastExecution ? new Date(robot.lastExecution).toLocaleString("pt-BR") : "—"}</span>
                    <span>Próximo ciclo: {new Date(robot.nextCycle).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={busy === robot.id} onClick={() => handleToggle(robot)}>
                      {robot.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {robot.isActive ? "Pausar" : "Ativar"}
                    </Button>
                    <Button size="sm" disabled={busy === `run-${robot.id}`} onClick={() => handleRun(robot)}>
                      {busy === `run-${robot.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "Executar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

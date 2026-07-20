"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type ExecutivePayload = {
  dashboard: {
    availability: number;
    health: { status: string; latencyMs: number | null; configured: boolean };
    kpis: {
      avgLatencyMs: number;
      maxLatencyMs: number;
      p95LatencyMs: number;
      errors24h: number;
      tokensToday: number;
      tokensMonth: number;
      costDailyUsd: number;
      costMonthlyUsd: number;
      activeUsersMonth: number;
      conversationsActive: number;
      conversationsMonth: number;
      messagesToday: number;
      toolsRegistered: number;
      toolsUsed24h: number;
      requests24h: number;
    };
    usageByModule: Record<string, number>;
    usageByRole: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    byTool: Record<string, { count: number; avgLatencyMs: number }>;
    alerts: Array<{ type: string; level: string; message: string }>;
    generatedAt: string;
  };
  readiness: {
    overall: "approved" | "approved_with_reservations" | "needs_fix";
    items: Array<{
      id: string;
      label: string;
      ok: boolean;
      evidence: string;
      verdict: string;
    }>;
  };
};

const VERDICT_LABEL: Record<string, string> = {
  approved: "Produção Aprovada",
  approved_with_reservations: "Produção Aprovada com Ressalvas",
  needs_fix: "Correção Necessária",
};

export function AdminAiExecutivePanel() {
  const [data, setData] = useState<ExecutivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/executive", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar.");
        return;
      }
      setData(json.data as ExecutivePayload);
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const d = data?.dashboard;
  const r = data?.readiness;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Dashboard Executivo — IA</h2>
          <p className="text-sm text-muted-foreground">
            Status, custos, latência, uso por módulo/usuário, alertas e parecer de produção.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ai/enterprise">Enterprise</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ai/foundation">Fundação</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {d && r ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3">
                Parecer: {VERDICT_LABEL[r.overall] ?? r.overall}
                <AdminStatusBadge status={d.health.status} />
              </CardTitle>
              <CardDescription>
                Disponibilidade estimada {d.availability}% · OpenAI{" "}
                {d.health.configured ? "configurado" : "não configurado"} · gerado{" "}
                {new Date(d.generatedAt).toLocaleString("pt-BR")}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <Metric label="Latência média" value={`${d.kpis.avgLatencyMs} ms`} />
            <Metric label="Latência p95" value={`${d.kpis.p95LatencyMs} ms`} />
            <Metric label="Latência máx" value={`${d.kpis.maxLatencyMs} ms`} />
            <Metric label="Erros 24h" value={d.kpis.errors24h} />
            <Metric label="Requests 24h" value={d.kpis.requests24h} />
            <Metric label="Msgs hoje" value={d.kpis.messagesToday} />
            <Metric label="Custo hoje USD" value={d.kpis.costDailyUsd.toFixed(4)} />
            <Metric label="Custo mês USD" value={d.kpis.costMonthlyUsd.toFixed(4)} />
            <Metric label="Tokens mês" value={d.kpis.tokensMonth} />
            <Metric label="Usuários ativos (mês)" value={d.kpis.activeUsersMonth} />
            <Metric label="Conversas ativas" value={d.kpis.conversationsActive} />
            <Metric label="Tools usadas 24h" value={d.kpis.toolsUsed24h} />
          </div>

          {d.alerts.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {d.alerts.map((a) => (
                  <p
                    key={`${a.type}-${a.message}`}
                    className={
                      a.level === "critical"
                        ? "text-red-600"
                        : a.level === "warning"
                          ? "text-amber-700"
                          : "text-muted-foreground"
                    }
                  >
                    [{a.type}/{a.level}] {a.message}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Uso por módulo</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {Object.keys(d.usageByModule).length === 0 ? (
                  <p className="text-muted-foreground">Sem dados no período.</p>
                ) : (
                  Object.entries(d.usageByModule)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mod, n]) => (
                      <div key={mod} className="flex justify-between border-b py-1">
                        <span>{mod}</span>
                        <span className="text-muted-foreground">{n}</span>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top usuários</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 space-y-1 overflow-y-auto text-sm">
                {d.topUsers.length === 0 ? (
                  <p className="text-muted-foreground">Sem dados no período.</p>
                ) : (
                  d.topUsers.slice(0, 15).map((u) => (
                    <div key={u.userId} className="flex justify-between border-b py-1">
                      <span className="truncate font-mono text-xs">{u.userId.slice(0, 12)}…</span>
                      <span className="text-muted-foreground">{u.count} req</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Checklist de produção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {r.items.map((item) => (
                <div key={item.id} className="rounded border px-3 py-2">
                  <p className="font-medium">
                    {item.ok ? "✓" : "○"} {item.label} — {VERDICT_LABEL[item.verdict] ?? item.verdict}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.evidence}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Carregando dashboard…</p>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

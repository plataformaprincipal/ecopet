"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type Diagnostics = {
  health: { status: string; latencyMs: number | null };
  configured: boolean;
  responsesApi: { preferred: boolean; streamPreferred: boolean; chatCompletionsFallback: boolean };
  functionCalling: {
    schemas: boolean;
    validation: boolean;
    executor: boolean;
    permissions: boolean;
    openAiToolLoop: boolean;
    mcp: boolean;
    toolsRegistered: number;
  };
  models: { chat: string; tools: string; fallback: string };
  security: { promptFirewall: boolean; sensitiveSanitize: boolean; securityEventsTable: boolean };
  files: { uploadCloudinary: boolean; ocr: boolean; vision: boolean; virusScan: string };
  costs: {
    daily: { costUsd: number; tokens: number; requests: number; errors: number };
    monthly: { costUsd: number; tokens: number; requests: number; errors: number };
    byTool: Record<string, { count: number; avgLatencyMs: number }>;
    budgets: { dailyUsd: number; monthlyUsd: number };
    alerts: Array<{ level: string; message: string }>;
  };
  observability: {
    requests: number;
    failures: number;
    avgToolLatencyMs: number;
    toolsUsed: string[];
    recentSecurity: Array<{ id: string; category: string; severity: string; decision: string; createdAt: string }>;
    recentTools: Array<{ id: string; toolName: string; success: boolean; latencyMs: number; createdAt: string }>;
  };
  cache: { backend: string; redisReady: boolean };
  jobs: { backend: string; queuesImplemented: boolean };
  generatedAt: string;
};

export function AdminAiEnterprisePanel() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/enterprise", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar.");
        return;
      }
      setData(json.data as Diagnostics);
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">IA Enterprise</h2>
          <p className="text-sm text-muted-foreground">
            Health, custos, Function Calling, segurança, performance e diagnóstico de produção.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ai/costs">Custos legado</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ai/modules">Módulos</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Health
                <AdminStatusBadge status={data.health.status} />
              </CardTitle>
              <CardDescription>
                Latência: {data.health.latencyMs ?? "—"} ms · Configurado:{" "}
                {data.configured ? "sim" : "não"}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Custo hoje (USD)" value={data.costs.daily.costUsd.toFixed(4)} />
            <Metric label="Custo mês (USD)" value={data.costs.monthly.costUsd.toFixed(4)} />
            <Metric label="Tokens (mês)" value={data.costs.monthly.tokens} />
            <Metric label="Falhas 24h" value={data.observability.failures} />
          </div>

          {data.costs.alerts.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Alertas de custo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data.costs.alerts.map((a) => (
                  <p key={a.message} className={a.level === "critical" ? "text-red-600" : "text-amber-700"}>
                    [{a.level}] {a.message}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Responses API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Flag ok={data.responsesApi.preferred} label="Preferencial" />
                <Flag ok={data.responsesApi.streamPreferred} label="Stream preferencial" />
                <Flag ok={data.responsesApi.chatCompletionsFallback} label="Fallback Completions" />
                <p className="text-muted-foreground">
                  Modelos: chat={data.models.chat} · tools={data.models.tools} · fallback=
                  {data.models.fallback}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Function Calling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Flag ok={data.functionCalling.openAiToolLoop} label="Loop operacional" />
                <Flag ok={data.functionCalling.schemas} label="Schemas" />
                <Flag ok={data.functionCalling.executor} label="Executor" />
                <Flag ok={data.functionCalling.mcp} label="MCP" />
                <p className="text-muted-foreground">
                  Tools registradas: {data.functionCalling.toolsRegistered}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Flag ok={data.security.promptFirewall} label="Prompt Firewall" />
                <Flag ok={data.security.sensitiveSanitize} label="Sanitize sensível" />
                <Flag ok={data.security.securityEventsTable} label="AISecurityEvent" />
                <Flag ok={data.files.uploadCloudinary} label="Upload Cloudinary" />
                <Flag ok={data.files.ocr} label="OCR" />
                <p className="text-muted-foreground">Virus scan: {data.files.virusScan}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance / Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Requests 24h: {data.observability.requests}</p>
                <p>Latência média tools: {data.observability.avgToolLatencyMs} ms</p>
                <p>Cache: {data.cache.backend} (Redis-ready: {data.cache.redisReady ? "sim" : "não"})</p>
                <p>
                  Jobs backend: {data.jobs.backend} · filas completas:{" "}
                  {data.jobs.queuesImplemented ? "sim" : "não"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ferramentas (mês)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.keys(data.costs.byTool).length === 0 ? (
                <p className="text-muted-foreground">Nenhuma execução registrada ainda.</p>
              ) : (
                Object.entries(data.costs.byTool).map(([name, v]) => (
                  <div key={name} className="flex justify-between rounded border px-3 py-2">
                    <span>{name}</span>
                    <span className="text-muted-foreground">
                      {v.count}× · ~{v.avgLatencyMs} ms
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Logs de tools</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 space-y-2 overflow-y-auto text-xs">
                {data.observability.recentTools.map((t) => (
                  <div key={t.id} className="flex justify-between border-b py-1">
                    <span>
                      {t.toolName} {t.success ? "✓" : "✗"}
                    </span>
                    <span className="text-muted-foreground">
                      {t.latencyMs}ms · {new Date(t.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Eventos de segurança</CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 space-y-2 overflow-y-auto text-xs">
                {data.observability.recentSecurity.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum evento recente.</p>
                ) : (
                  data.observability.recentSecurity.map((s) => (
                    <div key={s.id} className="flex justify-between border-b py-1">
                      <span>
                        {s.category} · {s.decision}
                      </span>
                      <span className="text-muted-foreground">{s.severity}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className={ok ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
      {ok ? "●" : "○"} {label}
    </p>
  );
}

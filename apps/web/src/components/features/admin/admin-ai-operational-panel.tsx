"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type FlagMap = Record<string, boolean>;

type Payload = {
  diagnostics: {
    flags: FlagMap;
    automationRules: Array<{ id: string; event: string; risk: string; channels: string[] }>;
    modules: string[];
  };
  rules: Array<{
    id: string;
    name: string;
    event: string;
    description: string;
    risk: string;
    channels: string[];
  }>;
  recentJobs: Array<{
    id: string;
    status: string;
    createdAt: string;
    error?: string | null;
    payload: unknown;
  }>;
};

export function AdminAiOperationalPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyRule, setBusyRule] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/operational", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar.");
        return;
      }
      setData(json.data as Payload);
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runRule(ruleId: string) {
    setBusyRule(ruleId);
    try {
      const res = await fetch("/api/admin/ai/operational", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_rule",
          ruleId,
          title: "Teste operacional EcoPet IA",
          message: "Execução manual de automação (admin).",
          dedupeKey: `admin-test:${ruleId}:${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao executar regra.");
        return;
      }
      await load();
    } finally {
      setBusyRule(null);
    }
  }

  const flags = data?.diagnostics.flags ?? {};

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">IA Operacional</h2>
          <p className="text-sm text-muted-foreground">
            Feature flags, automações, orquestrador, Marketplace/Explorar/Meu Pet e previsões
            explicáveis.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature flags</CardTitle>
          <CardDescription>
            Controle via env <code className="text-xs">AI_FLAG_*</code> — sem exibir segredos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(flags).map(([key, on]) => (
            <AdminStatusBadge key={key} status={on ? `${key}:ON` : `${key}:OFF`} />
          ))}
          {!Object.keys(flags).length && loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regras de automação</CardTitle>
          <CardDescription>
            Persistência em AIJob + notificação in-app com deduplicação 24h.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.rules ?? []).map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.id} · {rule.event} · risco {rule.risk} · {rule.channels.join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyRule === rule.id}
                onClick={() => void runRule(rule.id)}
              >
                Executar teste
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execuções recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.recentJobs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução recente.</p>
          ) : (
            (data?.recentJobs ?? []).map((job) => (
              <div key={job.id} className="flex flex-wrap items-center gap-2 text-sm">
                <AdminStatusBadge status={job.status} />
                <span className="text-muted-foreground">{job.id}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString()}
                </span>
                {job.error ? <span className="text-xs text-red-600">{job.error}</span> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Módulos operacionais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(data?.diagnostics.modules ?? []).map((m) => (
            <AdminStatusBadge key={m} status={m} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

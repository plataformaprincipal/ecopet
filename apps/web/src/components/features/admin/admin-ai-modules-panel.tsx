"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type BusinessPayload = {
  modules: string[];
  toolsCount: number;
  tools: Array<{
    name: string;
    modules: string[];
    personas: string[];
    readOnly: boolean;
  }>;
  functionCalling: {
    schemas: boolean;
    validation: boolean;
    executor: boolean;
    permissions: boolean;
    openAiToolLoop: boolean;
    mcp: boolean;
  };
  memory: {
    shortTerm: boolean;
    longTermSummary: boolean;
    extractiveSummary: boolean;
    cleanup: boolean;
  };
  rag: {
    abstractionReady: boolean;
    embeddingsEnabledByDefault: boolean;
    vectorDb: boolean;
  };
  cache: { backend: string; redisReady: boolean; probe: boolean };
  generatedAt: string;
};

type Payload = {
  analytics: {
    conversations: number;
    messages: number;
    monthTokens: number;
    monthCostUsd: number;
    failuresMonth: number;
  };
  health: { status: string; latencyMs: number | null };
  business: BusinessPayload;
};

export function AdminAiModulesPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/assistant", { credentials: "include" });
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

  const business = data?.business;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">IA — Módulos & Ferramentas</h2>
          <p className="text-sm text-muted-foreground">
            Context builder, tool registry, function calling (prep), memória e diagnóstico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ai/assistant">Assistente</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {data && business ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Módulos" value={business.modules.length} />
            <Metric label="Ferramentas" value={business.toolsCount} />
            <Metric label="Tokens (mês)" value={data.analytics.monthTokens} />
            <Metric
              label="Custo est. (mês)"
              value={`USD ${Number(data.analytics.monthCostUsd).toFixed(4)}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Health
                <AdminStatusBadge status={data.health.status} />
              </CardTitle>
              <CardDescription>
                Latência fundação: {data.health.latencyMs ?? "—"} ms · Falhas mês:{" "}
                {data.analytics.failuresMonth}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Function Calling</CardTitle>
              <CardDescription>Arquitetura preparada — loop OpenAI nativo ainda desligado</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <Flag ok={business.functionCalling.schemas} label="Schemas" />
              <Flag ok={business.functionCalling.validation} label="Validação" />
              <Flag ok={business.functionCalling.executor} label="Executor" />
              <Flag ok={business.functionCalling.permissions} label="Permissões" />
              <Flag ok={business.functionCalling.openAiToolLoop} label="Loop OpenAI tools" />
              <Flag ok={business.functionCalling.mcp} label="MCP" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Memória & RAG</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <Flag ok={business.memory.shortTerm} label="Memória curta" />
              <Flag ok={business.memory.longTermSummary} label="Memória longa / resumo" />
              <Flag ok={business.memory.extractiveSummary} label="Resumo extrativo" />
              <Flag ok={business.rag.abstractionReady} label="Abstração RAG" />
              <Flag ok={business.rag.embeddingsEnabledByDefault} label="Embeddings default" />
              <Flag ok={business.rag.vectorDb} label="Banco vetorial" />
              <Flag ok={business.cache.redisReady} label="Cache Redis-ready" />
              <p className="text-muted-foreground">Cache atual: {business.cache.backend}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Módulos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {business.modules.map((m) => (
                <span
                  key={m}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ferramentas registradas</CardTitle>
              <CardDescription>Somente leitura via services — sem Prisma direto na IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {business.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tool.modules.join(", ")} · {tool.personas.join(", ")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tool.readOnly ? "read-only" : "mutating"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
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

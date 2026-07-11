"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AiPlatformData = {
  agents: { id: string; name: string; description: string }[];
  models: { id: string; provider: string; label: string; enabled: boolean }[];
  providers: { openai: { configured: boolean }; anthropic: { configured: boolean }; google: { configured: boolean }; ready: boolean };
  stats: { totalRequests: number; totalTokens: number; totalCostUsd: number; byAgent: Record<string, number> };
  prompts: { key: string; version: string; agentId: string }[];
  integrationPoints: { id: string; label: string; route: string; status: string }[];
  governance?: {
    usage: { total: number; errors: number; estimatedCostUsd: number; byModule: Record<string, number>; byRole: Record<string, number> };
    indexedDocuments: number;
    pendingModeration: number;
    config: { model: string; dailyUserLimit: number; monthlyBudgetCents: number; globallyEnabled: boolean };
  } | null;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include", cache: "no-store" });
  const body = await res.json();
  if (!res.ok || body.success === false) throw new Error(body.error?.message ?? "Erro ao carregar");
  return body.data as T;
}

export function AdminAiPlatformPanel() {
  const [data, setData] = useState<AiPlatformData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [agentsRes, modelsRes, promptsRes, governance] = await Promise.all([
        fetchJson<{ agents: AiPlatformData["agents"]; integrationPoints: AiPlatformData["integrationPoints"] }>("/api/ai/agents"),
        fetchJson<{ models: AiPlatformData["models"]; providers: AiPlatformData["providers"] }>("/api/ai/models"),
        fetchJson<{ prompts: AiPlatformData["prompts"]; stats: AiPlatformData["stats"]; providers: AiPlatformData["providers"] }>("/api/ai/prompts"),
        fetchJson<{
          usage: { total: number; errors: number; estimatedCostUsd: number; byModule: Record<string, number>; byRole: Record<string, number> };
          indexedDocuments: number;
          pendingModeration: number;
          config: { model: string; dailyUserLimit: number; monthlyBudgetCents: number; globallyEnabled: boolean };
        }>("/api/admin/ai/governance").catch(() => null),
      ]);

      setData({
        agents: agentsRes.agents,
        integrationPoints: agentsRes.integrationPoints,
        models: modelsRes.models,
        providers: promptsRes.providers ?? modelsRes.providers,
        prompts: promptsRes.prompts,
        stats: promptsRes.stats,
        governance,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando plataforma de IA…</p>;
  }

  if (error) {
    return <p className="p-6 text-sm text-red-600" role="alert">{error}</p>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Plataforma AI-First</h1>
        <p className="text-sm text-muted-foreground">
          Infraestrutura centralizada de IA — agentes, modelos, prompts, logs e integrações.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status OpenAI</CardDescription>
            <CardTitle className="text-lg">
              {data.providers.openai.configured ? "Chave configurada" : "Aguardando chave"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Agentes</CardDescription>
            <CardTitle className="text-lg">{data.agents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modelos</CardDescription>
            <CardTitle className="text-lg">{data.models.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Prompts versionados</CardDescription>
            <CardTitle className="text-lg">{data.prompts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs e custos</CardTitle>
          <CardDescription>Últimas 500 requisições registradas na plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          <div className="rounded border p-3 text-center">
            <p className="text-2xl font-bold">{data.stats.totalRequests}</p>
            <p className="text-xs text-muted-foreground">Requisições</p>
          </div>
          <div className="rounded border p-3 text-center">
            <p className="text-2xl font-bold">{data.stats.totalTokens.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">Tokens estimados</p>
          </div>
          <div className="rounded border p-3 text-center">
            <p className="text-2xl font-bold">US$ {data.stats.totalCostUsd.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">Custo estimado</p>
          </div>
        </CardContent>
      </Card>

      {data.governance && (
        <Card>
          <CardHeader>
            <CardTitle>Governança OpenAI</CardTitle>
            <CardDescription>
              Modelo {data.governance.config.model} · limite diário {data.governance.config.dailyUserLimit} ·
              orçamento {data.governance.config.monthlyBudgetCents}¢ ·{" "}
              {data.governance.config.globallyEnabled ? "ativa" : "pausada"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border p-3 text-center">
              <p className="text-2xl font-bold">{data.governance.usage.total}</p>
              <p className="text-xs text-muted-foreground">Uso no mês</p>
            </div>
            <div className="rounded border p-3 text-center">
              <p className="text-2xl font-bold">{data.governance.usage.errors}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
            <div className="rounded border p-3 text-center">
              <p className="text-2xl font-bold">{data.governance.indexedDocuments}</p>
              <p className="text-xs text-muted-foreground">Docs indexados</p>
            </div>
            <div className="rounded border p-3 text-center">
              <p className="text-2xl font-bold">{data.governance.pendingModeration}</p>
              <p className="text-xs text-muted-foreground">Moderação pendente</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agentes cadastrados</CardTitle>
          <CardDescription>Cada agente possui prompt, permissões, ferramentas e memória próprios.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.agents.map((agent) => (
            <div key={agent.id} className="rounded-lg border p-3">
              <p className="font-medium">{agent.name}</p>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
              <Badge variant="outline" className="mt-2 text-xs">{agent.id}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modelos disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.models.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span>{m.label} <span className="text-muted-foreground">({m.provider})</span></span>
              <Badge variant={m.enabled ? "default" : "secondary"}>{m.enabled ? "Ativo" : "Futuro"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pontos de integração</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {data.integrationPoints.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span>{p.label}</span>
              <Badge variant="outline">{p.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provedores</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={data.providers.openai.configured ? "default" : "secondary"}>OpenAI</Badge>
          <Badge variant={data.providers.anthropic.configured ? "default" : "secondary"}>Claude</Badge>
          <Badge variant={data.providers.google.configured ? "default" : "secondary"}>Gemini</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

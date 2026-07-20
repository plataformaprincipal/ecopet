"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type Payload = {
  analytics: {
    conversations: number;
    messages: number;
    monthRequests: number;
    monthTokens: number;
    monthCostUsd: number;
    feedbacksMonth: number;
    failuresMonth: number;
    generatedAt: string;
  };
  health: { status: string; latencyMs: number | null };
};

export function AdminAiAssistantPanel() {
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Assistente Virtual</h2>
          <p className="text-sm text-muted-foreground">
            Conversas, health, tokens e custos agregados — sem prompts armazenados aqui.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/eccopet">Abrir assistente</Link>
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
              <CardDescription>Latência fundação: {data.health.latencyMs ?? "—"} ms</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Conversas" value={data.analytics.conversations} />
            <Metric label="Mensagens" value={data.analytics.messages} />
            <Metric label="Requests (mês)" value={data.analytics.monthRequests} />
            <Metric label="Tokens (mês)" value={data.analytics.monthTokens} />
            <Metric
              label="Custo est. (mês USD)"
              value={Number(data.analytics.monthCostUsd).toFixed(4)}
            />
            <Metric label="Feedbacks (mês)" value={data.analytics.feedbacksMonth} />
            <Metric label="Falhas (mês)" value={data.analytics.failuresMonth} />
            <Metric
              label="Gerado em"
              value={new Date(data.analytics.generatedAt).toLocaleString("pt-BR")}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/ai/conversations">Conversas</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/ai/costs">Custos</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/ai/feedbacks">Feedback</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/ai/foundation">Fundação / Health</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/ai/modules">Módulos & Tools</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/ai/logs">Logs / Erros</Link>
              </Button>
            </CardContent>
          </Card>
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
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

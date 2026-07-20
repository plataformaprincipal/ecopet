"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import { useAI } from "@/hooks/use-ai";
import { useAIHealth } from "@/hooks/use-ai-health";

type Section =
  | "overview"
  | "status"
  | "health"
  | "models"
  | "config"
  | "diagnostics"
  | "logs"
  | "usage"
  | "tests";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "status", label: "Status" },
  { id: "health", label: "Health" },
  { id: "models", label: "Modelos" },
  { id: "config", label: "Configuração" },
  { id: "diagnostics", label: "Diagnóstico" },
  { id: "logs", label: "Logs" },
  { id: "usage", label: "Uso" },
  { id: "tests", label: "Testes" },
];

export function AdminAiFoundationPanel() {
  const { status, loading, error, refresh } = useAI();
  const { data: health, loading: healthLoading, run: runHealth } = useAIHealth();
  const [section, setSection] = useState<Section>("overview");
  const [diagnostics, setDiagnostics] = useState<{
    warnings?: string[];
    errors?: string[];
    recommendations?: string[];
  } | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDiagnostics = useCallback(async () => {
    const res = await fetch("/api/admin/ai/foundation?view=diagnostics", {
      credentials: "include",
    });
    const json = await res.json();
    if (res.ok && json.success) setDiagnostics(json.data);
  }, []);

  useEffect(() => {
    if (section === "diagnostics") void loadDiagnostics();
    if (section === "health") void runHealth();
  }, [section, loadDiagnostics, runHealth]);

  const runTest = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/ai/foundation", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setTestResult(json.error?.message ?? "Falha no teste.");
      } else {
        setTestResult(
          json.data.ok
            ? `OK · ${json.data.model} · ${json.data.latencyMs}ms · ${json.data.preview}`
            : `Falhou · ${json.data.errorCode ?? "erro"}`
        );
      }
    } catch {
      setTestResult("Erro de rede.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Fundação IA</h2>
          <p className="text-sm text-muted-foreground">
            Cliente singleton, health, sanitização e smoke test — sem expandir assistentes de domínio.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
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
          <CardTitle className="flex flex-wrap items-center gap-3">
            Visão Geral
            <AdminStatusBadge
              status={status?.configured ? "READY" : "NOT_CONFIGURED"}
            />
          </CardTitle>
          <CardDescription>
            Ambiente {status?.environment ?? "—"} · modelo {status?.defaultModel ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <Metric label="API Key" value={status?.apiKeyMasked ?? "não configurada"} />
          <Metric label="Project ID" value={status?.projectIdMasked ?? "opcional / ausente"} />
          <Metric label="Habilitada" value={status?.globallyEnabled ? "sim" : "não"} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={section === s.id ? "default" : "outline"}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {section === "status" || section === "overview" ? (
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {loading ? "Carregando…" : null}
            {!loading && status ? (
              <ul className="list-inside list-disc space-y-1">
                <li>Configurado: {status.configured ? "sim" : "não"}</li>
                <li>Modelo padrão: {status.defaultModel}</li>
                <li>Project: {status.projectIdMasked ?? "não definido"}</li>
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {section === "health" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Health
              {health ? <AdminStatusBadge status={health.status} /> : null}
            </CardTitle>
            <CardDescription>
              Latência: {health?.latencyMs ?? "—"} ms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={healthLoading}
              onClick={() => void runHealth()}
            >
              {healthLoading ? "…" : "Executar health"}
            </Button>
            <ul className="space-y-1 text-sm">
              {(health?.checks ?? []).map((c) => (
                <li key={c.id} className="flex justify-between gap-2 border-b py-1">
                  <span>
                    <code>{c.id}</code> · {c.detail}
                  </span>
                  <AdminStatusBadge status={c.ok ? "PASS" : "FAIL"} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {section === "models" || section === "config" ? (
        <Card>
          <CardHeader>
            <CardTitle>{section === "models" ? "Modelos" : "Configuração"}</CardTitle>
            <CardDescription>
              Fonte: env (`OPENAI_MODEL`, embeddings, timeout, retries). Sem edição de secrets no
              painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Modelo: {status?.defaultModel ?? "—"}</p>
            <p>
              Catálogo completo e agents:{" "}
              <a className="underline" href="/admin/ai/models">
                /admin/ai/models
              </a>
            </p>
            <p className="text-xs">OPENAI_API_KEY / PROJECT_ID só via Vercel / .env.</p>
          </CardContent>
        </Card>
      ) : null}

      {section === "diagnostics" ? (
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-red-600">{diagnostics?.errors?.join(" · ") || "Sem erros"}</p>
            <p className="text-amber-700">
              {diagnostics?.warnings?.join(" · ") || "Sem warnings"}
            </p>
            <ul className="list-inside list-disc text-muted-foreground">
              {(diagnostics?.recommendations ?? []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {section === "logs" || section === "usage" ? (
        <Card>
          <CardHeader>
            <CardTitle>{section === "logs" ? "Logs" : "Uso"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ver painéis existentes:{" "}
            <a className="underline" href="/admin/ai/logs">
              Logs
            </a>{" "}
            ·{" "}
            <a className="underline" href="/admin/ai/costs">
              Custos / uso
            </a>
            . Fundação não duplica warehouse de prompts.
          </CardContent>
        </Card>
      ) : null}

      {section === "tests" ? (
        <Card>
          <CardHeader>
            <CardTitle>Teste controlado</CardTitle>
            <CardDescription>
              Chamada mínima (`max_tokens=8`, resposta “OK”). Rate limit aplicado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button type="button" disabled={busy} onClick={() => void runTest()}>
              {busy ? "Executando…" : "Executar smoke"}
            </Button>
            {testResult ? <p className="text-sm">{testResult}</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-all">{value}</p>
    </div>
  );
}

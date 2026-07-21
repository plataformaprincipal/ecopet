"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "@/components/features/admin/ui/admin-status-badge";

type Payload = {
  health: {
    configured: boolean;
    environment: string;
    serviceName: string;
    release: string;
    hostPreview: string | null;
    sourceIdPreview: string | null;
    region: string | null;
    tokenConfigured: boolean;
    tracingFunctional: boolean;
    flags: Record<string, boolean>;
    sessionReplaySupported: boolean;
  };
  transport: {
    lastSuccessAt: string | null;
    lastErrorAt: string | null;
    lastErrorCode: string | null;
    suppressed: number;
  };
  limitations: Record<string, string | boolean>;
  providers: Array<{ id: string; name: string; status: string }>;
};

export function AdminObservabilityPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/observability/health", { credentials: "include" });
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

  async function sendTest() {
    if (!confirm("Enviar evento de teste ao Better Stack?")) return;
    setTestResult(null);
    const res = await fetch("/api/internal/observability/health", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      setTestResult(json.error?.message ?? "Falha no teste.");
      return;
    }
    setTestResult(`OK — correlationId: ${json.data.correlationId}`);
    await load();
  }

  const h = data?.health;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Observabilidade</h2>
          <p className="text-sm text-muted-foreground">
            Better Stack — logs sanitizados. Sem Session Replay. Sem exposição de tokens.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button type="button" onClick={() => void sendTest()}>
            Enviar evento de teste
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {testResult ? <p className="text-sm text-muted-foreground">{testResult}</p> : null}

      {h ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
              <CardDescription>
                {h.serviceName} · {h.environment} · release {h.release}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <AdminStatusBadge status={h.configured ? "CONFIGURED" : "NOT_CONFIGURED"} />
              <AdminStatusBadge status={h.tokenConfigured ? "TOKEN_OK" : "TOKEN_MISSING"} />
              <AdminStatusBadge status={h.tracingFunctional ? "TRACING_ON" : "TRACING_OFF"} />
              <AdminStatusBadge status={h.sessionReplaySupported ? "REPLAY_ON" : "REPLAY_N_A"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Better Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Host: {h.hostPreview ?? "—"}</p>
              <p>Source ID: {h.sourceIdPreview ?? "—"}</p>
              <p>Região: {h.region ?? "—"}</p>
              <p>Último sucesso: {data?.transport.lastSuccessAt ?? "—"}</p>
              <p>
                Último erro: {data?.transport.lastErrorAt ?? "—"}{" "}
                {data?.transport.lastErrorCode ? `(${data.transport.lastErrorCode})` : ""}
              </p>
              <p>Eventos suprimidos (transporte): {data?.transport.suppressed ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(h.flags).map(([k, v]) => (
                <AdminStatusBadge key={k} status={`${k}:${v ? "ON" : "OFF"}`} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Providers</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(data?.providers ?? []).map((p) => (
                <AdminStatusBadge key={p.id} status={`${p.name}:${p.status}`} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Limitações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {Object.entries(data?.limitations ?? {}).map(([k, v]) => (
                <p key={k}>
                  <span className="font-medium text-foreground">{k}:</span> {String(v)}
                </p>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

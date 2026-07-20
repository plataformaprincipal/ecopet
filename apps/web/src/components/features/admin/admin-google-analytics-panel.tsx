"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type GaDiag = {
  provider: string;
  version: string;
  status: {
    configured: boolean;
    enabled: boolean;
    measurementIdMasked: string | null;
    environment: string;
    sendToGoogle: boolean;
    debug: boolean;
    consentDefault: {
      analytics_storage: string;
      ad_storage: string;
      ad_user_data: string;
      ad_personalization: string;
    };
    status: string;
    sanitizedMessage: string;
  };
  measurementIdConfigured: boolean;
  measurementIdMasked: string | null;
  sendToGoogle: boolean;
  scriptHosts: string[];
  consentMode: string;
  notes: string[];
  health: {
    envOk: boolean;
    idFormatOk: boolean;
    runtimeReady: boolean;
  };
  backend?: {
    version: string;
    health: {
      status: string;
      alive: boolean;
      ready: boolean;
      catalogEventCount: number;
      avgResponseMs: number | null;
      lastErrorCode: string | null;
      build: string | null;
      environment: string;
    };
    cache: { hits: number; misses: number; size: number; ttlSec: number };
    queue: { pending: number; failed: number; supported: boolean };
    dataApiStatus: string;
    propertyIdMasked: string | null;
    catalogEventCount: number;
    responseMs: number;
    ops: {
      lastSyncAt: string | null;
      lastErrorCode: string | null;
      configFlags: {
        debugLogging?: boolean;
        cacheTtlSec?: number;
        healthJobsEnabled?: boolean;
      };
    };
  };
};

export function AdminGoogleAnalyticsPanel() {
  const [data, setData] = useState<GaDiag | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations/google-analytics/diagnostics", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar diagnóstico.");
        return;
      }
      setData(json.data as GaDiag);
    } catch {
      setError("Não foi possível carregar o diagnóstico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (kind: "test" | "cache" | "health") => {
    setBusy(kind);
    setActionMsg(null);
    try {
      if (kind === "test") {
        const res = await fetch("/api/admin/analytics/test", {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        setActionMsg(
          res.ok && json.success
            ? `Probe OK — ${json.data.responseMs}ms · health ${json.data.health}`
            : json.error?.message ?? "Falha no probe."
        );
      } else if (kind === "cache") {
        const res = await fetch("/api/admin/analytics/cache", {
          method: "DELETE",
          credentials: "include",
        });
        const json = await res.json();
        setActionMsg(res.ok && json.success ? "Cache limpo." : json.error?.message ?? "Falha ao limpar cache.");
      } else {
        const res = await fetch("/api/admin/analytics/health?persist=1", {
          credentials: "include",
        });
        const json = await res.json();
        setActionMsg(
          res.ok && json.success
            ? `Health ${json.data.status} · ready=${json.data.ready}`
            : json.error?.message ?? "Falha no health."
        );
      }
      await load();
    } catch {
      setActionMsg("Falha de rede na ação.");
    } finally {
      setBusy(null);
    }
  };

  const backend = data?.backend;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Google Analytics 4"
        description="Tracking client + camada Backend Ops (health, cache, fila, diagnóstico)."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Integrações", href: "/admin/integracoes" },
          { label: "Google Analytics" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/bi/google-analytics">BI / Aquisição</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes">Voltar</Link>
          </Button>
        </div>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {actionMsg ? (
        <p className="text-sm text-muted-foreground" role="status">
          {actionMsg}
        </p>
      ) : null}

      {loading && !data ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Tracking (client)
                <AdminStatusBadge status={data.status.status} />
              </CardTitle>
              <CardDescription>{data.status.sanitizedMessage}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Ambiente:</span> {data.status.environment}
              </p>
              <p>
                <span className="text-muted-foreground">Envio:</span>{" "}
                {data.sendToGoogle ? "sim" : "não"}
              </p>
              <p>
                <span className="text-muted-foreground">Measurement ID:</span>{" "}
                {data.measurementIdConfigured
                  ? data.measurementIdMasked ?? "mascarado"
                  : "ausente"}
              </p>
              <p>
                <span className="text-muted-foreground">Consent Mode:</span> {data.consentMode}
              </p>
            </CardContent>
          </Card>

          {backend ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  Backend Ops
                  <AdminStatusBadge status={backend.health.status} />
                </CardTitle>
                <CardDescription>
                  Health, cache, fila JobQueue e Data API — sem Measurement ID completo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <Metric label="Alive" value={backend.health.alive ? "sim" : "não"} />
                  <Metric label="Ready" value={backend.health.ready ? "sim" : "não"} />
                  <Metric label="Versão ops" value={backend.version} />
                  <Metric label="Build" value={backend.health.build ?? "—"} />
                  <Metric label="Ambiente" value={backend.health.environment} />
                  <Metric label="Catálogo eventos" value={backend.catalogEventCount} />
                  <Metric label="Data API" value={backend.dataApiStatus} />
                  <Metric
                    label="Property"
                    value={backend.propertyIdMasked ?? "não configurada"}
                  />
                  <Metric label="Diag ms" value={backend.responseMs} />
                  <Metric label="Avg ms" value={backend.health.avgResponseMs ?? "—"} />
                  <Metric label="Último sync" value={backend.ops.lastSyncAt ?? "—"} />
                  <Metric label="Último erro" value={backend.ops.lastErrorCode ?? "—"} />
                  <Metric
                    label="Cache"
                    value={`${backend.cache.size}/${backend.cache.hits + backend.cache.misses} hits · size ${backend.cache.size} · TTL ${backend.cache.ttlSec}s`}
                  />
                  <Metric
                    label="Fila"
                    value={
                      backend.queue.supported
                        ? `pending ${backend.queue.pending} · failed ${backend.queue.failed}`
                        : "indisponível"
                    }
                  />
                  <Metric
                    label="Flags"
                    value={`debug=${backend.ops.configFlags.debugLogging ? "on" : "off"} · jobs=${backend.ops.configFlags.healthJobsEnabled ? "on" : "off"}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => void runAction("health")}
                  >
                    {busy === "health" ? "…" : "Health persist"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => void runAction("test")}
                  >
                    {busy === "test" ? "…" : "Probe / test"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => void runAction("cache")}
                  >
                    {busy === "cache" ? "…" : "Limpar cache"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Health (tracking)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <Metric label="Env OK" value={data.health.envOk ? "sim" : "não"} />
              <Metric label="Formato ID" value={data.health.idFormatOk ? "sim" : "não"} />
              <Metric label="Runtime ready" value={data.health.runtimeReady ? "sim" : "não"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consentimento (defaults)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                analytics_storage: <code>{data.status.consentDefault.analytics_storage}</code>
              </p>
              <p>
                ad_storage: <code>{data.status.consentDefault.ad_storage}</code>
              </p>
              <p>
                ad_user_data: <code>{data.status.consentDefault.ad_user_data}</code>
              </p>
              <p>
                ad_personalization: <code>{data.status.consentDefault.ad_personalization}</code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {data.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span> {value}
    </p>
  );
}

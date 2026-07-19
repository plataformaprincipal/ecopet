"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type TurnstileDiag = {
  provider: string;
  version: string;
  status: {
    configured: boolean;
    enabled: boolean;
    siteKeyConfigured: boolean;
    secretKeyConfigured: boolean;
    environment: string;
    allowedHostnames: string[];
    status: string;
    sanitizedMessage?: string;
    siteKeyMasked?: string;
  };
  flows: Array<{ flow: string; action: string; mode: string; description: string }>;
  metrics: {
    total: number;
    approved: number;
    rejected: number;
    hostnameFailures: number;
    actionFailures: number;
    expired: number;
    configErrors: number;
    unavailable: number;
    successRate: number;
    lastSuccessAt: string | null;
    lastErrorAt: string | null;
    lastErrorCode: string | null;
  };
  notes: string[];
};

export function AdminTurnstilePanel() {
  const [data, setData] = useState<TurnstileDiag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations/turnstile/diagnostics", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar diagnóstico.");
        return;
      }
      setData(json.data as TurnstileDiag);
    } catch {
      setError("Não foi possível carregar o diagnóstico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Cloudflare Turnstile"
        description="Proteção anti-bot — configuração sanitizada, métricas e fluxos protegidos."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Integrações", href: "/admin/integracoes" },
          { label: "Turnstile" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes">Voltar às integrações</Link>
          </Button>
        </div>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !data ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Status
                <AdminStatusBadge status={data.status.status} />
              </CardTitle>
              <CardDescription>{data.status.sanitizedMessage}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Ambiente:</span> {data.status.environment}
              </p>
              <p>
                <span className="text-muted-foreground">Habilitado:</span>{" "}
                {data.status.enabled ? "sim" : "não"}
              </p>
              <p>
                <span className="text-muted-foreground">Site Key:</span>{" "}
                {data.status.siteKeyConfigured
                  ? data.status.siteKeyMasked ?? "configurada (mascarada)"
                  : "ausente"}
              </p>
              <p>
                <span className="text-muted-foreground">Secret Key:</span>{" "}
                {data.status.secretKeyConfigured ? "configurada (nunca exibida)" : "ausente"}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Hostnames permitidos:</span>{" "}
                {data.status.allowedHostnames.join(", ") || "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas (24h)</CardTitle>
              <CardDescription>Eventos sanitizados — sem tokens nem IPs brutos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <Metric label="Total" value={data.metrics.total} />
              <Metric label="Aprovadas" value={data.metrics.approved} />
              <Metric label="Rejeitadas" value={data.metrics.rejected} />
              <Metric label="Taxa de sucesso" value={`${data.metrics.successRate}%`} />
              <Metric label="Hostname" value={data.metrics.hostnameFailures} />
              <Metric label="Action" value={data.metrics.actionFailures} />
              <Metric label="Expirados/reuso" value={data.metrics.expired} />
              <Metric label="Indisponível" value={data.metrics.unavailable} />
              <Metric label="Config" value={data.metrics.configErrors} />
              <p className="sm:col-span-3 text-muted-foreground">
                Último sucesso: {data.metrics.lastSuccessAt ?? "—"} · Último erro:{" "}
                {data.metrics.lastErrorAt ?? "—"} ({data.metrics.lastErrorCode ?? "—"})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fluxos protegidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.flows.map((f) => (
                <div
                  key={f.flow}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ecopet-gray/15 px-3 py-2 dark:border-white/10"
                >
                  <div>
                    <p className="font-medium">{f.description}</p>
                    <p className="text-muted-foreground">
                      {f.action} · {f.mode}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas de segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
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

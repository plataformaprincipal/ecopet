"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";

type Dash = {
  config: { status: string; environment: string; sanitizedMessage?: string };
  metrics: Record<string, number | null>;
  catalog: Array<{
    panelKey: string;
    panelLabel: string;
    capability: string;
    notes: string;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    panelTopic: string | null;
    processingStatus: string;
    signatureValid: boolean;
    resourceId: string | null;
    failureReason: string | null;
    retryCount: number;
    environment: string;
    receivedAt: string;
  }>;
  byType: Array<{ topic: string | null; count: number }>;
};

export function MercadoPagoHubPanel({ section }: { section?: string }) {
  const [dash, setDash] = useState<Dash | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState<unknown>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/mercado-pago/dashboard", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Erro ao carregar.");
        return;
      }
      setDash(json.data);

      if (section === "fraudes") {
        const r = await fetch("/api/admin/mercado-pago/fraudes", { credentials: "include" });
        const j = await r.json();
        if (j.success) setExtra(j.data.alerts);
      } else if (section === "reclamacoes") {
        const r = await fetch("/api/admin/mercado-pago/reclamacoes", { credentials: "include" });
        const j = await r.json();
        if (j.success) setExtra(j.data.claims);
      } else if (section === "contestacoes") {
        const r = await fetch("/api/admin/mercado-pago/contestacoes", { credentials: "include" });
        const j = await r.json();
        if (j.success) setExtra(j.data.disputes);
      } else if (section === "eventos") {
        const r = await fetch("/api/admin/mercado-pago/events", { credentials: "include" });
        const j = await r.json();
        if (j.success) setExtra(j.data.events);
      }
    } catch {
      setError("Falha de rede.");
    } finally {
      setBusy(false);
    }
  }, [section]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reprocess(id: string) {
    if (!confirm("Reprocessar este evento?")) return;
    const res = await fetch(`/api/admin/mercado-pago/events/${id}/reprocess`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    alert(json.success ? `OK: ${json.data?.result?.processingStatus}` : json.error?.message);
    void load();
  }

  async function reconcile() {
    const res = await fetch("/api/admin/mercado-pago/reconcile", {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    alert(
      json.success
        ? `Conciliação: ${json.data.issuesCreated} issues`
        : json.error?.message ?? "Erro"
    );
    void load();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          section === "fraudes"
            ? "Fraudes MP"
            : section === "reclamacoes"
              ? "Reclamações MP"
              : section === "contestacoes"
                ? "Contestações MP"
                : section === "eventos"
                  ? "Eventos webhook MP"
                  : "Mercado Pago — Hub"
        }
        description="Webhooks multi-tópico · API Orders · sem exposição de segredos"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Mercado Pago", href: "/admin/mercado-pago/eventos" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={busy}>
            Atualizar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void reconcile()}>
            Conciliar
          </Button>
        </div>
      </AdminPageHeader>

      <div className="flex flex-wrap gap-2 px-4 sm:px-6">
        {[
          ["Hub", "/admin/mercado-pago/eventos"],
          ["Fraudes", "/admin/mercado-pago/fraudes"],
          ["Reclamações", "/admin/mercado-pago/reclamacoes"],
          ["Contestações", "/admin/mercado-pago/contestacoes"],
          ["Integrações", "/admin/integracoes"],
        ].map(([label, href]) => (
          <Button key={href} asChild size="sm" variant="outline">
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </div>

      {error ? (
        <p className="px-4 text-sm text-red-600 sm:px-6" role="alert">
          {error}
        </p>
      ) : null}

      {dash ? (
        <div className="grid gap-4 px-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-6">
          {(
            [
              ["Recebidos 30d", dash.metrics.received30d],
              ["Processados", dash.metrics.processed30d],
              ["Falhas", dash.metrics.failed30d],
              ["Dead letter", dash.metrics.deadLetters],
              ["Retry", dash.metrics.retryPending],
              ["Fraudes abertas", dash.metrics.fraudOpen],
              ["Reclamações", dash.metrics.claimsOpen],
              ["Contestações", dash.metrics.disputesOpen],
            ] as const
          ).map(([label, value]) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{value ?? "—"}</CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {dash ? (
        <div className="grid gap-4 px-4 lg:grid-cols-2 sm:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AdminStatusBadge status={dash.config.status} />
              <p>Ambiente: {dash.config.environment}</p>
              {dash.config.sanitizedMessage ? (
                <p className="text-muted-foreground">{dash.config.sanitizedMessage}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Taxa entrega: {dash.metrics.deliveryRate ?? "—"} · Erro:{" "}
                {dash.metrics.errorRate ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catálogo de tópicos</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 space-y-2 overflow-auto text-xs">
              {dash.catalog.map((t) => (
                <div key={t.panelKey} className="border-b border-dashed pb-2">
                  <p className="font-medium">
                    {t.panelLabel}{" "}
                    <span className="font-mono text-muted-foreground">({t.capability})</span>
                  </p>
                  <p className="text-muted-foreground">{t.notes}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!section || section === "eventos" ? (
        <Card className="mx-4 sm:mx-6">
          <CardHeader>
            <CardTitle className="text-base">Eventos recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(Array.isArray(extra) ? extra : dash?.recentEvents ?? []).map(
              (e: {
                id: string;
                eventType: string;
                panelTopic?: string | null;
                processingStatus: string;
                signatureValid?: boolean;
                resourceId?: string | null;
                failureReason?: string | null;
                retryCount?: number;
              }) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-xs">
                      {e.eventType} · {e.panelTopic ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.processingStatus}
                      {e.signatureValid === false ? " · assinatura inválida" : ""}
                      {e.resourceId ? ` · ${e.resourceId}` : ""}
                      {e.failureReason ? ` · ${e.failureReason}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void reprocess(e.id)}>
                    Reprocessar
                  </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      ) : null}

      {section === "fraudes" && Array.isArray(extra) ? (
        <Card className="mx-4 sm:mx-6">
          <CardHeader>
            <CardTitle className="text-base">Fila de fraude</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {extra.map(
              (a: {
                id: string;
                status: string;
                description: string | null;
                order?: { orderNumber: number; total: number } | null;
                paymentProviderId: string | null;
              }) => (
                <div key={a.id} className="rounded border px-3 py-2">
                  <p className="font-medium">
                    {a.status} · pedido #{a.order?.orderNumber ?? "—"} · R${" "}
                    {a.order?.total?.toFixed?.(2) ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.description} · payment {a.paymentProviderId ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Critérios internos de fraude não são exibidos ao cliente.
                  </p>
                </div>
              )
            )}
            {extra.length === 0 ? (
              <p className="text-muted-foreground">Nenhum alerta.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {(section === "reclamacoes" || section === "contestacoes") && Array.isArray(extra) ? (
        <Card className="mx-4 sm:mx-6">
          <CardHeader>
            <CardTitle className="text-base">
              {section === "reclamacoes" ? "Reclamações" : "Contestações"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {extra.map((row: { id: string; status: string; amount?: number | null; order?: { orderNumber: number } | null }) => (
              <div key={row.id} className="rounded border px-3 py-2">
                <p>
                  {row.status} · #{row.order?.orderNumber ?? "—"}
                  {row.amount != null ? ` · R$ ${Number(row.amount).toFixed(2)}` : ""}
                </p>
              </div>
            ))}
            {extra.length === 0 ? <p className="text-muted-foreground">Nenhum registro.</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

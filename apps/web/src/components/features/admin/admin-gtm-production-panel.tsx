"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import type { ProductionCheckItem, ProductionReadinessReport } from "@/lib/admin/production/types";

const SECTIONS = [
  { id: "status", label: "Status Geral" },
  { id: "seguranca", label: "Segurança", area: "Segurança" },
  { id: "lgpd", label: "LGPD", area: "LGPD" },
  { id: "performance", label: "Performance", area: "Performance" },
  { id: "seo", label: "SEO", area: "SEO" },
  { id: "analytics", label: "Analytics", area: "Analytics" },
  { id: "gtm", label: "GTM", area: "GTM" },
  { id: "health", label: "Health", area: "Health" },
  { id: "diagnostics", label: "Diagnóstico" },
  { id: "checklist", label: "Checklist", area: "Checklist" },
  { id: "logs", label: "Logs" },
  { id: "versoes", label: "Versões" },
] as const;

type GtmLive = {
  maskedContainerId?: string | null;
  healthStatus?: string;
  environment?: string;
  eventContractVersion?: number;
  enabled?: boolean;
  deduplication?: { claims?: number; duplicatesBlocked?: number };
  lastErrorCode?: string | null;
  msg?: string;
};

export function AdminGtmProductionPanel() {
  const [data, setData] = useState<ProductionReadinessReport | null>(null);
  const [gtm, setGtm] = useState<GtmLive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("status");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, statusRes, healthRes] = await Promise.all([
        fetch("/api/admin/production/status", { credentials: "include" }),
        fetch("/api/admin/gtm/status", { credentials: "include" }),
        fetch("/api/admin/gtm/health", { credentials: "include" }),
      ]);
      const prodJson = await prodRes.json();
      if (!prodRes.ok || prodJson.success === false) {
        setError(prodJson.error?.message ?? "Falha ao carregar produção.");
        return;
      }
      setData(prodJson.data as ProductionReadinessReport);

      const statusJson = await statusRes.json();
      const healthJson = await healthRes.json();
      if (statusRes.ok && statusJson.success) {
        setGtm({
          maskedContainerId: statusJson.data.maskedContainerId,
          healthStatus:
            healthRes.ok && healthJson.success
              ? healthJson.data.status
              : statusJson.data.healthStatus,
          environment: statusJson.data.environment,
          eventContractVersion: statusJson.data.eventContractVersion,
          enabled: statusJson.data.enabled,
          deduplication: statusJson.data.deduplication,
          lastErrorCode: statusJson.data.lastErrorCode,
        });
      } else {
        setGtm({ msg: statusJson.error?.message ?? "Status GTM indisponível." });
      }
    } catch {
      setError("Não foi possível carregar o status de produção GTM.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredChecks = useMemo(() => {
    if (!data) return [] as ProductionCheckItem[];
    const def = SECTIONS.find((s) => s.id === section);
    if (!def || !("area" in def) || !def.area) {
      return data.checks.filter(
        (c) =>
          c.area === "GTM" ||
          c.area === "Analytics" ||
          c.area === "LGPD" ||
          c.area === "Segurança" ||
          c.id.startsWith("launch-gtm")
      );
    }
    return data.checks.filter((c) => c.area === def.area);
  }, [data, section]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Produção — Google Tag Manager"
        description="Status geral, segurança, LGPD, performance, SEO, analytics, health e checklist de go-live GTM."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Produção", href: "/admin/producao" },
          { label: "Google Tag Manager" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes/google-tag-manager">Governança GTM</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes/google-analytics">GA4 Ops</Link>
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
              <CardTitle className="flex flex-wrap items-center gap-3">
                Status Geral GTM
                <AdminStatusBadge status={data.overall} />
                {gtm?.healthStatus ? <AdminStatusBadge status={gtm.healthStatus} /> : null}
              </CardTitle>
              <CardDescription>
                Ambiente {gtm?.environment ?? data.environment}
                {data.vercelEnv ? ` · Vercel ${data.vercelEnv}` : ""} · v{data.version}
                {data.build ? ` · build ${data.build}` : ""} ·{" "}
                {new Date(data.generatedAt).toLocaleString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <Metric label="Container" value={gtm?.maskedContainerId ?? "não configurado"} />
              <Metric label="Coleta" value={gtm?.enabled ? "habilitada" : "off / n/d"} />
              <Metric label="Contrato" value={gtm?.eventContractVersion ?? "—"} />
              <Metric
                label="Dedup claims"
                value={gtm?.deduplication?.claims ?? "Sem dados"}
              />
              <Metric
                label="Duplicações bloqueadas"
                value={gtm?.deduplication?.duplicatesBlocked ?? "Sem dados"}
              />
              <Metric label="Último erro" value={gtm?.lastErrorCode ?? "Sem dados"} />
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

          {section === "diagnostics" ? (
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico</CardTitle>
                <CardDescription>
                  Links para APIs reais — sem simulação de container publicado.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/api/admin/gtm/diagnostics">GTM Diagnostics</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/api/admin/gtm/health">GTM Health</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/api/admin/analytics/diagnostics">GA Diagnostics</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/api/health">API Health</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {section === "logs" ? (
            <Card>
              <CardHeader>
                <CardTitle>Logs & Auditoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Auditoria administrativa:{" "}
                  <Link href="/api/admin/gtm/audit" className="underline underline-offset-2">
                    GET /api/admin/gtm/audit
                  </Link>
                </p>
                <p>
                  Amostras Data Layer (ops): use a seção Logs no{" "}
                  <Link
                    href="/admin/integracoes/google-tag-manager"
                    className="underline underline-offset-2"
                  >
                    Centro de Governança GTM
                  </Link>
                  .
                </p>
                <p className="text-xs">Sem warehouse de eventos do navegador. Sem PII nos logs.</p>
              </CardContent>
            </Card>
          ) : null}

          {section === "versoes" ? (
            <Card>
              <CardHeader>
                <CardTitle>Versões</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <Metric label="Módulo produção" value={data.version} />
                <Metric label="Build" value={data.build ?? "Sem dados"} />
                <Metric label="Contrato eventos" value={gtm?.eventContractVersion ?? "—"} />
                <Metric label="Estratégia" value="B (gtag + espelhos GTM)" />
              </CardContent>
            </Card>
          ) : null}

          {section !== "diagnostics" && section !== "logs" && section !== "versoes" ? (
            <Card>
              <CardHeader>
                <CardTitle>{SECTIONS.find((s) => s.id === section)?.label ?? "Checks"}</CardTitle>
                <CardDescription>
                  {filteredChecks.length} itens · itens MANUAL exigem Preview / DebugView /
                  Lighthouse humanos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredChecks.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-1 border-b pb-3 last:border-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.detail}</p>
                      {c.href ? (
                        <Link href={c.href} className="text-xs underline underline-offset-2">
                          Abrir
                        </Link>
                      ) : null}
                    </div>
                    <AdminStatusBadge status={c.status} />
                  </div>
                ))}
                {filteredChecks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados nesta seção.</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-all">{value}</p>
    </div>
  );
}

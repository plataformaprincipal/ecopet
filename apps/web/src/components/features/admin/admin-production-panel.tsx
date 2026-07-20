"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import type { ProductionReadinessReport } from "@/lib/admin/production/types";

const SECTIONS = [
  { id: "status", label: "Status Geral" },
  { id: "seguranca", label: "Segurança", area: "Segurança" },
  { id: "analytics", label: "Analytics", area: "Analytics" },
  { id: "gtm", label: "GTM", area: "GTM" },
  { id: "performance", label: "Performance", area: "Performance" },
  { id: "lgpd", label: "LGPD", area: "LGPD" },
  { id: "seo", label: "SEO", area: "SEO" },
  { id: "integracoes", label: "Integrações" },
  { id: "health", label: "Health", area: "Health" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "checklist", label: "Checklist", area: "Checklist" },
  { id: "banco", label: "Banco", area: "Banco" },
  { id: "logs", label: "Logs" },
  { id: "versoes", label: "Versões" },
] as const;

export function AdminProductionPanel() {
  const [data, setData] = useState<ProductionReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("status");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/production/status", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar status de produção.");
        return;
      }
      setData(json.data as ProductionReadinessReport);
    } catch {
      setError("Não foi possível carregar o relatório.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredChecks = useMemo(() => {
    if (!data) return [];
    const def = SECTIONS.find((s) => s.id === section);
    if (!def || !("area" in def) || !def.area) return data.checks;
    return data.checks.filter((c) => c.area === def.area);
  }, [data, section]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Produção"
        description="Status geral, segurança, LGPD, SEO, analytics e checklist de lançamento."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Produção" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/producao/google-tag-manager">Produção GTM</Link>
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
                Status Geral
                <AdminStatusBadge status={data.overall} />
              </CardTitle>
              <CardDescription>
                Ambiente {data.environment}
                {data.vercelEnv ? ` · Vercel ${data.vercelEnv}` : ""} · v{data.version}
                {data.build ? ` · build ${data.build}` : ""} · gerado{" "}
                {new Date(data.generatedAt).toLocaleString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
              <Metric label="PASS" value={data.summary.pass} />
              <Metric label="WARN" value={data.summary.warn} />
              <Metric label="FAIL" value={data.summary.fail} />
              <Metric label="MANUAL/N-A" value={data.summary.manual} />
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

          {section === "status" || section === "integracoes" ? (
            <Card>
              <CardHeader>
                <CardTitle>Serviços & Integrações</CardTitle>
                <CardDescription>Sem secrets — apenas status sanitizado.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{svc.name}</p>
                      {svc.detail ? (
                        <p className="text-xs text-muted-foreground">{svc.detail}</p>
                      ) : null}
                    </div>
                    <AdminStatusBadge status={svc.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {section === "diagnostics" ? (
            <Card>
              <CardHeader>
                <CardTitle>Diagnostics rápidos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 text-sm">
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/producao/google-tag-manager">Produção GTM</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/integracoes/google-tag-manager">GTM Governança</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/integracoes/google-analytics">GA Backend Ops</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/integracoes">Hub Integrações</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/bi">Business Intelligence</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/api/health">API Health</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/api/admin/gtm/diagnostics">GTM Diagnostics</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/api/admin/analytics/diagnostics">Analytics Diagnostics</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {section === "logs" ? (
            <Card>
              <CardHeader>
                <CardTitle>Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  GTM audit:{" "}
                  <Link className="underline" href="/api/admin/gtm/audit">
                    /api/admin/gtm/audit
                  </Link>
                </p>
                <p>
                  Analytics ops: painel{" "}
                  <Link className="underline" href="/admin/integracoes/google-analytics">
                    Google Analytics
                  </Link>
                </p>
                <p className="text-xs">Logs sanitizados — sem tokens, cookies ou PII.</p>
              </CardContent>
            </Card>
          ) : null}

          {section === "versoes" ? (
            <Card>
              <CardHeader>
                <CardTitle>Versões</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Módulo produção</p>
                  <p className="font-medium">{data.version}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Build</p>
                  <p className="font-medium">{data.build ?? "Sem dados"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Ambiente</p>
                  <p className="font-medium">{data.environment}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Vercel</p>
                  <p className="font-medium">{data.vercelEnv ?? "local"}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {section === "banco" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  Infraestrutura Supabase / Postgres
                  {data.supabase?.pitrEnabled === false ? (
                    <AdminStatusBadge status="N/A" />
                  ) : null}
                </CardTitle>
                <CardDescription>
                  Resumo sanitizado — sem senhas. Backups diários e PITR exigem confirmação no
                  Dashboard Supabase.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Host runtime</p>
                  <p className="font-medium break-all">
                    {data.supabase?.databaseHost ?? "Sem dados"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Host DIRECT_URL</p>
                  <p className="font-medium break-all">
                    {data.supabase?.directUrlHost ?? "Sem dados"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Backups diários</p>
                  <p className="font-medium">Confirmar no Dashboard (Pro)</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">PITR</p>
                  <p className="font-medium">
                    {data.supabase?.pitrEnabled ? "Habilitado" : "Não habilitado"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Auth</p>
                  <p className="font-medium">{data.supabase?.authProvider ?? "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="font-medium">{data.supabase?.storagePrimary ?? "—"}</p>
                </div>
                <div className="rounded-md border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Última auditoria (report)</p>
                  <p className="font-medium">
                    {data.supabase?.lastAuditAt
                      ? new Date(data.supabase.lastAuditAt).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {section !== "diagnostics" &&
          section !== "integracoes" &&
          section !== "logs" &&
          section !== "versoes" ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {SECTIONS.find((s) => s.id === section)?.label ?? "Checks"}
                </CardTitle>
                <CardDescription>
                  {filteredChecks.length} itens · última sync{" "}
                  {data.meta.lastSyncAt
                    ? new Date(data.meta.lastSyncAt).toLocaleString("pt-BR")
                    : "—"}
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
                  <p className="text-sm text-muted-foreground">Nenhum item nesta seção.</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {data.meta.notes.map((n) => (
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span> {value}
    </p>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import type { GtmGovernanceReport, GtmGovernanceSection } from "@/lib/admin/gtm-governance/types";

const SECTIONS: { id: GtmGovernanceSection; label: string }[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "backend", label: "Backend" },
  { id: "datalayer", label: "Data Layer" },
  { id: "tags", label: "Tags" },
  { id: "triggers", label: "Triggers" },
  { id: "variables", label: "Variables" },
  { id: "consent", label: "Consentimento" },
  { id: "bi", label: "BI" },
  { id: "modules", label: "Módulos" },
  { id: "health", label: "Health" },
  { id: "diagnostics", label: "Diagnóstico" },
  { id: "logs", label: "Logs" },
  { id: "environments", label: "Ambientes" },
  { id: "debug", label: "Debug" },
  { id: "exports", label: "Exportações" },
  { id: "alerts", label: "Alertas" },
];

export function AdminGoogleTagManagerPanel() {
  const [data, setData] = useState<GtmGovernanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<GtmGovernanceSection>("overview");
  const [backend, setBackend] = useState<{
    status?: string;
    health?: string;
    dedup?: string;
    config?: string;
    msg?: string;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (persist = false) => {
    setLoading(true);
    setError(null);
    try {
      const q = persist ? "?persist=1&fresh=1" : "?fresh=1";
      const res = await fetch(`/api/admin/gtm/governance${q}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar governança GTM.");
        return;
      }
      setData(json.data as GtmGovernanceReport);
    } catch {
      setError("Não foi possível carregar o Centro GTM.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const runBackend = async (action: "status" | "health" | "config" | "cache" | "test") => {
    setBusy(action);
    setBackend(null);
    try {
      if (action === "cache") {
        const res = await fetch("/api/admin/gtm/cache", {
          method: "DELETE",
          credentials: "include",
        });
        const json = await res.json();
        setBackend({
          msg: res.ok && json.success ? "Cache limpo." : json.error?.message ?? "Falha.",
        });
      } else if (action === "test") {
        const res = await fetch("/api/admin/gtm/test", {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        setBackend({
          msg:
            res.ok && json.success
              ? `Teste: ${json.data.event} · id ${String(json.data.event_id).slice(0, 8)}…`
              : json.error?.message ?? "Falha no teste.",
        });
      } else if (action === "config") {
        const res = await fetch("/api/admin/gtm/config", { credentials: "include" });
        const json = await res.json();
        setBackend({
          config:
            res.ok && json.success
              ? `collection=${json.data.flags.collectionEnabled} debug=${json.data.flags.debugEnabled}`
              : json.error?.message ?? "Falha",
        });
      } else if (action === "health") {
        const res = await fetch("/api/admin/gtm/health?persist=1", {
          credentials: "include",
        });
        const json = await res.json();
        setBackend({
          health: res.ok && json.success ? json.data.status : json.error?.message ?? "Falha",
        });
      } else {
        const res = await fetch("/api/admin/gtm/status", { credentials: "include" });
        const json = await res.json();
        if (res.ok && json.success) {
          setBackend({
            status: json.data.healthStatus,
            dedup: `claims ${json.data.deduplication?.claims ?? 0} · blocked ${json.data.deduplication?.duplicatesBlocked ?? 0}`,
            msg: json.data.maskedContainerId ?? "sem container",
          });
        } else {
          setBackend({ msg: json.error?.message ?? "Falha" });
        }
      }
    } catch {
      setBackend({ msg: "Erro de rede." });
    } finally {
      setBusy(null);
    }
  };

  const [moduleFilter, setModuleFilter] = useState("");

  const filteredModules = useMemo(() => {
    if (!data) return [];
    const q = moduleFilter.trim().toLowerCase();
    if (!q) return data.modules;
    return data.modules.filter(
      (m) =>
        m.module.includes(q) ||
        m.label.toLowerCase().includes(q) ||
        m.sampleEvents.some((e) => e.includes(q))
    );
  }, [data, moduleFilter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Google Tag Manager — Centro de Governança"
        description="Tags, Data Layer, consentimento, health e inventário EcoPet — sem duplicar o warehouse do GTM."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Integrações", href: "/admin/integracoes" },
          { label: "Google Tag Manager" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load(true)} disabled={loading}>
            Atualizar + Health
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes/google-analytics">GA4 Ops</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/bi/google-analytics">BI Aquisição</Link>
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
                Visão Geral
                <AdminStatusBadge status={data.overview.status} />
                <AdminStatusBadge status={data.health.status} />
              </CardTitle>
              <CardDescription>
                {data.overview.sanitizedMessage} · v{data.version}
                {data.overview.build ? ` · build ${data.overview.build}` : ""} ·{" "}
                {new Date(data.generatedAt).toLocaleString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <Metric
                label="Container"
                value={data.overview.containerIdMasked ?? "não configurado"}
              />
              <Metric label="Ambiente" value={data.overview.environment} />
              <Metric label="Carga" value={data.overview.loadContainer ? "ativa" : "off"} />
              <Metric label="Debug" value={data.overview.debug ? "on" : "off"} />
              <Metric label="GA4" value={data.overview.gaStatus} />
              <Metric label="Último sync" value={data.overview.lastSyncAt ?? "—"} />
              <Metric label="Último erro" value={data.overview.lastErrorCode ?? "—"} />
              <Metric label="Avg ms" value={data.overview.avgResponseMs ?? "—"} />
              <Metric
                label="Conectado"
                value={data.overview.containerConnected ? "sim" : "não"}
              />
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

          {section === "overview" ? (
            <Card>
              <CardHeader>
                <CardTitle>Anti-duplicação</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{data.overview.antiDuplicationNote}</p>
                <p className="mt-2 text-xs">{data.meta.dataSource}</p>
              </CardContent>
            </Card>
          ) : null}

          {section === "backend" ? (
            <Card>
              <CardHeader>
                <CardTitle>Backend GTM Ops</CardTitle>
                <CardDescription>
                  Status, health, config operacional, teste controlado e cache — sem API remota do
                  GTM.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["status", "Status"],
                      ["health", "Health"],
                      ["config", "Config"],
                      ["test", "Teste"],
                      ["cache", "Limpar cache"],
                    ] as const
                  ).map(([action, label]) => (
                    <Button
                      key={action}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => void runBackend(action)}
                    >
                      {busy === action ? "…" : label}
                    </Button>
                  ))}
                </div>
                {backend ? (
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {backend.msg ? (
                      <>
                        <dt className="text-muted-foreground">Info</dt>
                        <dd>{backend.msg}</dd>
                      </>
                    ) : null}
                    {backend.status ? (
                      <>
                        <dt className="text-muted-foreground">Health status</dt>
                        <dd>
                          <code>{backend.status}</code>
                        </dd>
                      </>
                    ) : null}
                    {backend.health ? (
                      <>
                        <dt className="text-muted-foreground">Health</dt>
                        <dd>
                          <code>{backend.health}</code>
                        </dd>
                      </>
                    ) : null}
                    {backend.dedup ? (
                      <>
                        <dt className="text-muted-foreground">Deduplicação</dt>
                        <dd>{backend.dedup}</dd>
                      </>
                    ) : null}
                    {backend.config ? (
                      <>
                        <dt className="text-muted-foreground">Flags</dt>
                        <dd>
                          <code>{backend.config}</code>
                        </dd>
                      </>
                    ) : null}
                  </dl>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sem dados — execute Status ou Health. Catálogo: GET /api/admin/gtm/events ·
                    Auditoria: GET /api/admin/gtm/audit · Diagnóstico: GET
                    /api/admin/gtm/diagnostics.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {section === "datalayer" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cobertura de instrumentação</CardTitle>
                  <CardDescription>{data.coverage.strategy}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    Implementados: {data.coverage.implementedCount} / catálogo{" "}
                    {data.coverage.catalogCount} ({data.coverage.coveragePct}%)
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                    {data.coverage.implemented.map((i) => (
                      <li key={`${i.surface}-${i.event_name}`}>
                        <code>{i.event_name}</code> · {i.module} · {i.surface}
                        {i.confirmed_after_success ? " · pós-sucesso" : " · início de fluxo"}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Ainda sem wiring (amostra):{" "}
                    {data.coverage.notInstrumentedSample.slice(0, 12).join(", ") || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Métricas runtime do pipeline (consent/dedupe): abra o console e inspecione{" "}
                    <code>window.__ecopetGtmMetrics</code> — não há warehouse fictício.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Data Layer</CardTitle>
                  <CardDescription>
                    {data.dataLayer.catalogTotal} eventos no catálogo · amostras ops:{" "}
                    {data.dataLayer.recentSamples.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {data.dataLayer.namespacedEvents.map((e) => (
                      <div key={e.name} className="rounded-md border p-2">
                        <code className="text-xs">{e.name}</code>
                        <p className="text-xs text-muted-foreground">{e.purpose}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{data.dataLayer.discardedNote}</p>
                  <div>
                    <p className="mb-2 font-medium">Por módulo (catálogo)</p>
                    <BarList
                      items={data.dataLayer.byModule.slice(0, 12).map((m) => ({
                        label: m.module,
                        value: m.count,
                      }))}
                    />
                  </div>
                  <div>
                    <p className="mb-2 font-medium">Últimas amostras (ops)</p>
                    {data.dataLayer.recentSamples.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma amostra ainda. Use Debug no browser ou POST
                        /api/admin/gtm/datalayer-sample.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {data.dataLayer.recentSamples.map((s, i) => (
                          <li key={`${s.at}-${i}`}>
                            <code>{s.event}</code> · {s.module ?? "—"} ·{" "}
                            {new Date(s.at).toLocaleString("pt-BR")}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {section === "tags" || section === "triggers" || section === "variables" ? (
            <InventoryCard
              title={section === "tags" ? "Tags" : section === "triggers" ? "Triggers" : "Variables"}
              items={
                section === "tags"
                  ? data.tags
                  : section === "triggers"
                    ? data.triggers
                    : data.variables
              }
            />
          ) : null}

          {section === "consent" ? (
            <Card>
              <CardHeader>
                <CardTitle>Consentimento (Consent Mode v2)</CardTitle>
                <CardDescription>
                  Banner: {data.consent.bannerImplemented ? "sim" : "não"} · CMP-ready:{" "}
                  {data.consent.cmpReady ? "sim" : "não"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                {Object.entries(data.consent.defaults).map(([k, v]) => (
                  <p key={k}>
                    <code>{k}</code>: <AdminStatusBadge status={v === "granted" ? "PASS" : "WARN"} />{" "}
                    {v}
                  </p>
                ))}
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  {data.consent.lastChangeNote}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {section === "bi" ? (
            <Card>
              <CardHeader>
                <CardTitle>Business Intelligence (estrutural)</CardTitle>
                <CardDescription>{data.bi.note}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BarList
                  items={data.bi.eventsByModule.map((m) => ({
                    label: m.module,
                    value: m.count,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  País/cidade/dispositivo/navegador: volumes live no GA Data API —{" "}
                  <Link href={data.bi.relatedBiHref} className="underline">
                    abrir BI GA4
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          ) : null}

          {section === "modules" ? (
            <Card>
              <CardHeader>
                <CardTitle>Módulos EcoPet</CardTitle>
                <CardDescription>
                  <input
                    className="mt-2 w-full max-w-sm rounded-md border px-3 py-1.5 text-sm"
                    placeholder="Filtrar módulo / evento…"
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                  />
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredModules.map((m) => (
                  <div key={m.module} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.eventCount} eventos · mirror <code>{m.gtmMirror}</code>
                    </p>
                    <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                      {m.sampleEvents.map((e) => (
                        <li key={e}>
                          <code>{e}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {section === "health" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Health Check <AdminStatusBadge status={data.health.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.health.checks.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-2 border-b py-2 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.detail}</p>
                    </div>
                    <AdminStatusBadge status={c.ok ? "PASS" : "FAIL"} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {section === "diagnostics" ? (
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Data Layer ativo: {data.diagnostics.dataLayerActive ? "sim" : "não"} · Consent:{" "}
                  {data.diagnostics.consentMode}
                </p>
                <p className="text-xs text-muted-foreground">
                  Scripts: {data.diagnostics.scripts.join(", ")}
                </p>
                {data.diagnostics.problems.length ? (
                  <ul className="list-inside list-disc text-amber-700 dark:text-amber-300">
                    {data.diagnostics.problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Nenhum problema crítico detectado.</p>
                )}
                <ul className="list-inside list-disc text-xs text-muted-foreground">
                  {data.diagnostics.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {section === "logs" ? (
            <Card>
              <CardHeader>
                <CardTitle>Logs internos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.logs.map((l, i) => (
                  <p key={`${l.at}-${i}`}>
                    <AdminStatusBadge status={l.level === "ERROR" ? "FAIL" : "PASS"} />{" "}
                    <span className="text-xs text-muted-foreground">
                      {new Date(l.at).toLocaleString("pt-BR")}
                    </span>{" "}
                    {l.message}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {section === "environments" ? (
            <Card>
              <CardHeader>
                <CardTitle>Ambientes</CardTitle>
                <CardDescription>Atual: {data.environments.current}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.environments.matrix.map((e) => (
                  <div key={e.env} className="rounded-md border p-3 text-sm">
                    <p className="font-medium capitalize">{e.env}</p>
                    <p className="text-xs text-muted-foreground">
                      GTM load: {e.gtmLoads ? "sim" : "não"} · GA send:{" "}
                      {e.gaSends ? "sim" : "não"} — {e.note}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {section === "debug" ? (
            <Card>
              <CardHeader>
                <CardTitle>Debug / Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Flag debug: {data.debug.debugFlag ? "on" : "off"}</p>
                <p className="text-muted-foreground">{data.debug.previewHint}</p>
                <p className="text-xs">Último erro: {data.debug.lastErrorCode ?? "—"}</p>
              </CardContent>
            </Card>
          ) : null}

          {section === "exports" ? (
            <Card>
              <CardHeader>
                <CardTitle>Exportações</CardTitle>
                <CardDescription>JSON / CSV / Excel(CSV) / PDF(texto)</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(["json", "csv", "excel", "pdf"] as const).map((fmt) => (
                  <Button key={fmt} asChild size="sm" variant="outline">
                    <a href={`/api/admin/gtm/export?format=${fmt}`} target="_blank" rel="noreferrer">
                      Export {fmt.toUpperCase()}
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {section === "alerts" ? (
            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum alerta.</p>
                ) : (
                  data.alerts.map((a) => (
                    <div key={a.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <AdminStatusBadge
                          status={
                            a.severity === "error" ? "FAIL" : a.severity === "warn" ? "WARN" : "PASS"
                          }
                        />
                        <span className="font-medium">{a.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                  ))
                )}
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
    <p>
      <span className="text-muted-foreground">{label}:</span> {value}
    </p>
  );
}

function InventoryCard({
  title,
  items,
}: {
  title: string;
  items: GtmGovernanceReport["tags"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Inventário de governança EcoPet (recomendado) — não é sync live da API GTM.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1 border-b pb-3 text-sm last:border-0 sm:flex-row sm:justify-between"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.type}
                {item.module ? ` · ${item.module}` : ""} — {item.detail}
              </p>
            </div>
            <AdminStatusBadge status={item.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="text-xs">
          <div className="mb-0.5 flex justify-between">
            <span>{i.label}</span>
            <span>{i.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-emerald-600/80"
              style={{ width: `${Math.round((i.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

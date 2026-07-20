"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminErpShell } from "./erp/admin-erp-shell";
import { adminFetch } from "@/lib/admin/client-api";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { BI_DOMAIN_META, type BiDomain } from "@/lib/admin/bi/domains";
import { BI_PERIOD_OPTIONS } from "@/lib/admin/bi/periods";
import { analyticsService } from "@/lib/analytics/service";
import { AdminEvents } from "@/lib/analytics/events";

type Props = { domain?: BiDomain };

export function AdminBiIntelligencePanel({ domain = "executive" }: Props) {
  const [data, setData] = useState<ErpModuleResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [city, setCity] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const meta = useMemo(
    () => BI_DOMAIN_META.find((d) => d.id === domain) ?? BI_DOMAIN_META[0],
    [domain]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const q = new URLSearchParams({
        period,
        ...(period === "custom" && dateFrom ? { dateFrom } : {}),
        ...(period === "custom" && dateTo ? { dateTo } : {}),
        ...(city ? { city } : {}),
        ...(stateFilter ? { state: stateFilter } : {}),
      });
      const result = await adminFetch<ErpModuleResponse>(
        `/api/admin/bi/${domain}?${q.toString()}`
      );
      setData(result);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("403") || msg.toLowerCase().includes("permiss")) setForbidden(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [domain, period, dateFrom, dateTo, city, stateFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    analyticsService.track(AdminEvents.BI_OPEN, {
      params: { bi_domain: domain },
    });
    if (domain === "google-analytics") {
      analyticsService.track(AdminEvents.ANALYTICS_OPEN, {
        params: { bi_domain: domain },
      });
    }
  }, [domain]);

  const exportHref = (format: string) => {
    const q = new URLSearchParams({
      domain,
      format,
      period,
      ...(period === "custom" && dateFrom ? { dateFrom } : {}),
      ...(period === "custom" && dateTo ? { dateTo } : {}),
    });
    return `/api/admin/bi/export?${q.toString()}`;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <nav
        aria-label="Módulos BI"
        className="h-fit rounded-xl border border-zinc-200/80 bg-white p-3 m-4 mb-0 lg:mb-4 dark:border-white/10 dark:bg-zinc-900/60 sm:ml-6"
      >
        <p className="mb-1 px-2 text-sm font-semibold">Centro de Inteligência</p>
        <p className="mb-3 px-2 text-xs text-muted-foreground">
          First-party EcoPet + GA4 Data API
        </p>
        <ul className="space-y-0.5">
          {BI_DOMAIN_META.map((d) => {
            const active = d.id === domain;
            return (
              <li key={d.id}>
                <Link
                  href={d.href}
                  className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-emerald-50 font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/5"
                  }`}
                >
                  {d.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 space-y-1 border-t border-zinc-100 pt-3 dark:border-white/10">
          <Button asChild size="sm" variant="ghost" className="w-full justify-start">
            <Link href="/admin/integracoes/google-analytics">Diagnóstico GA4</Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="w-full justify-start">
            <Link href="/admin/analytics">Analytics ERP</Link>
          </Button>
        </div>
      </nav>

      <div className="min-w-0 space-y-0">
        <div className="flex flex-wrap items-end gap-2 px-4 pt-4 sm:px-6">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="bi-period">
              Período
            </label>
            <select
              id="bi-period"
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {BI_PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {period === "custom" ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground">De</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Até</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
              </div>
            </>
          ) : null}
          <div>
            <label className="text-xs text-muted-foreground">Cidade</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="w-36" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Estado</label>
            <Input
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              placeholder="UF"
              className="w-24"
            />
          </div>
          <Button type="button" onClick={() => void load()} disabled={loading}>
            Aplicar
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={exportHref("csv")}>CSV</a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={exportHref("excel")}>Excel</a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={exportHref("json")}>JSON</a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={exportHref("pdf")}>PDF</a>
          </Button>
        </div>

        <AdminErpShell
          title={`BI · ${meta.label}`}
          description={meta.description}
          moduleId={`bi-${domain}`}
          data={data}
          loading={loading}
          error={error}
          forbidden={forbidden}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onFilter={(p) => {
            if (p.dateFrom) {
              setPeriod("custom");
              setDateFrom(p.dateFrom);
            }
            if (p.dateTo) {
              setPeriod("custom");
              setDateTo(p.dateTo);
            }
          }}
        />
      </div>
    </div>
  );
}

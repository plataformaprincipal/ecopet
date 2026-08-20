"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "./ui/admin-page-header";
import { quoteToDisplay } from "@/lib/pricing/display";
import type { PricingQuote } from "@/lib/pricing/types";

type Dashboard = {
  activeVersion: {
    version: string;
    country: string;
    currency: string;
    status: string;
    validFrom: string;
    updatedAt?: string | null;
    memoryFallback?: boolean;
  };
  nextVersion: { version: string; validFrom: string } | null;
  lastChange: { version: string; updatedAt: string; status: string } | null;
  catalogCounts: Record<string, number>;
  exceptions: number;
  promotions: number;
  marginAlerts: { sku: string; name: string; reason: string }[];
};

type CatalogItem = {
  sku: string;
  name: string;
  suite: string;
  kind: string;
  pricingMode: string;
  commercialAvailability: string;
  amountCents?: number | null;
  referenceTicketCents?: number | null;
  referenceTutorCents?: number | null;
  providerBaseCents?: number | null;
  rangeMinCents?: number | null;
  rangeMaxCents?: number | null;
  sourceDocument?: string;
  sourceSection?: string;
  sourceSku?: string;
  urgentEligible?: boolean;
  complexProcedure?: boolean;
};

const SUITES = ["MARKET", "SERVICES", "HEALTH", "ONE", "PRO", "AI", "ADS", "PROTECT", "CONNECT", "API"];

function brl(cents?: number | null) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function AdminPricingPanel() {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [suite, setSuite] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [calcKind, setCalcKind] = useState("PRODUCT");
  const [calcAmount, setCalcAmount] = useState("120");
  const [calcQuote, setCalcQuote] = useState<PricingQuote | null>(null);
  const [error, setError] = useState("");
  const [draftName, setDraftName] = useState("BR-2026.08-v2-draft");
  const [busy, setBusy] = useState(false);

  const loadDash = useCallback(async () => {
    const res = await fetch("/api/admin/pricing", { credentials: "include" });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha no dashboard");
    setDash(json.data);
  }, []);

  const loadCatalog = useCallback(async () => {
    const params = new URLSearchParams();
    if (suite) params.set("suite", suite);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/pricing/catalog?${params}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha no catálogo");
    setItems(json.data.items);
  }, [suite, q]);

  useEffect(() => {
    loadDash().catch((e) => setError(e instanceof Error ? e.message : "Erro"));
  }, [loadDash]);

  useEffect(() => {
    loadCatalog().catch((e) => setError(e instanceof Error ? e.message : "Erro"));
  }, [loadCatalog]);

  const display = useMemo(() => (calcQuote ? quoteToDisplay(calcQuote) : null), [calcQuote]);

  async function simulate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pricing/calculator", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: calcKind, baseAmount: Number(calcAmount), sku: selected?.sku }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha no simulador");
      setCalcQuote(json.data.quote);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  async function createDraft() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pricing/versions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: draftName }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha ao criar draft");
      await loadDash();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6" data-testid="admin-pricing-tower">
      <AdminPageHeader
        title="Pricing Control Tower"
        description="Fonte única de verdade comercial. Versão ACTIVE não é editada in-place."
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-pricing-dashboard">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Versão ativa</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p data-testid="admin-pricing-active-version">{dash?.activeVersion.version ?? "—"}</p>
            <p className="text-muted-foreground">
              {dash?.activeVersion.country}/{dash?.activeVersion.currency} · {dash?.activeVersion.status}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Próxima versão</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{dash?.nextVersion?.version ?? "Nenhuma agendada"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Catálogo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {dash ? `${dash.catalogCounts.TOTAL} SKUs oficiais` : "—"}
            <p className="text-muted-foreground">Exceções {dash?.exceptions ?? 0} · Promos {dash?.promotions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alertas de margem</CardTitle>
          </CardHeader>
          <CardContent className="text-sm" data-testid="admin-pricing-margin-alerts">
            {dash?.marginAlerts.length ? dash.marginAlerts.map((a) => <p key={a.sku}>{a.sku}</p>) : "Nenhum alerta"}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              data-testid="admin-pricing-search"
              placeholder="SKU ou nome"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              data-testid="admin-pricing-suite-filter"
              className="rounded border px-3 py-2 text-sm"
              value={suite}
              onChange={(e) => setSuite(e.target.value)}
            >
              <option value="">Todas as suítes</option>
              {SUITES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-80 overflow-auto text-sm">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th>SKU</th>
                  <th>Nome</th>
                  <th>Suíte</th>
                  <th>Modo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 80).map((item) => (
                  <tr
                    key={item.sku}
                    data-testid={`admin-pricing-sku-${item.sku}`}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelected(item)}
                  >
                    <td className="py-1 font-mono">{item.sku}</td>
                    <td>{item.name}</td>
                    <td>{item.suite}</td>
                    <td>{item.pricingMode}</td>
                    <td>{item.commercialAvailability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected ? (
        <Card data-testid="admin-pricing-sku-detail">
          <CardHeader>
            <CardTitle>
              {selected.sku} — {selected.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm sm:grid-cols-2">
            <p>Modo: {selected.pricingMode}</p>
            <p>Disponibilidade: {selected.commercialAvailability}</p>
            <p>Referência/ticket: {brl(selected.referenceTicketCents ?? selected.amountCents)}</p>
            <p>Tutor ref.: {brl(selected.referenceTutorCents)}</p>
            <p>Base prestador: {brl(selected.providerBaseCents)}</p>
            <p>
              Faixa: {brl(selected.rangeMinCents)} – {brl(selected.rangeMaxCents)}
            </p>
            <p>Documento: {selected.sourceDocument}</p>
            <p>Seção: {selected.sourceSection}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card data-testid="admin-pricing-calculator">
        <CardHeader>
          <CardTitle>Simulador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <select className="rounded border px-3 py-2 text-sm" value={calcKind} onChange={(e) => setCalcKind(e.target.value)}>
              <option value="PRODUCT">Produto</option>
              <option value="SERVICE">Serviço</option>
              <option value="HEALTH">Saúde</option>
            </select>
            <Input type="number" step="0.01" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} />
            <Button onClick={() => void simulate()} disabled={busy}>
              Calcular
            </Button>
          </div>
          {display ? (
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              <dt>Cliente paga</dt>
              <dd>{display.customerPays}</dd>
              <dt>Valor econômico do parceiro</dt>
              <dd>{display.partnerEconomic}</dd>
              <dt>Comissão EccoPet</dt>
              <dd>{display.eccopetCommission}</dd>
              <dt>Taxa fixa / booking</dt>
              <dd>
                {display.fixedFee} / {display.bookingFee}
              </dd>
              <dt>Reserva (Estimativa)</dt>
              <dd>{display.reserve}</dd>
              <dt>PSP (Estimativa)</dt>
              <dd>{display.pspEstimate}</dd>
              <dt>Contribuição (Estimativa)</dt>
              <dd>{display.contributionEstimate}</dd>
              <dt>Payout (Estimativa)</dt>
              <dd data-testid="admin-pricing-payout-estimate">{display.payoutEstimate}</dd>
            </dl>
          ) : null}
          <p className="text-xs text-muted-foreground">PSP, imposto e payout são estimativas — não valores liquidados.</p>
        </CardContent>
      </Card>

      <Card data-testid="admin-pricing-versions">
        <CardHeader>
          <CardTitle>Versões</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
          <Button onClick={() => void createDraft()} disabled={busy} data-testid="admin-pricing-create-draft">
            Criar draft
          </Button>
          <p className="text-xs text-muted-foreground">A versão ACTIVE não é editada diretamente. Mudança material exige nova versão.</p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listEccoPetSaudeQuotes } from "@/lib/eccopet-saude/plans";

type PlanRow = {
  seller: string;
  tier: { id: string; name: string; sku: string; periodDays: number; description: string; includedSkuLabels: string[] };
  catalogName: string;
  commercialAvailability: string;
  quote: { customerAmountCents: number; purchasable: boolean; blockedReasons: string[]; pricingVersion: string };
  recurringBilling: boolean;
};

export function EccoPetSaudePage() {
  const [plans, setPlans] = useState<PlanRow[] | null>(
    listEccoPetSaudeQuotes().map((row) => ({
      seller: row.seller,
      tier: row.tier,
      catalogName: row.catalogName,
      commercialAvailability: row.commercialAvailability,
      quote: {
        customerAmountCents: row.quote.customerAmountCents,
        purchasable: row.quote.purchasable,
        blockedReasons: row.quote.blockedReasons ?? [],
        pricingVersion: row.quote.pricingVersion,
      },
      recurringBilling: row.recurringBilling,
    }))
  );
  const [pets, setPets] = useState<Array<{ id: string; name: string }>>([]);
  const [petId, setPetId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/eccopet-saude/plans")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data.plans) && d.data.plans.length) setPlans(d.data.plans);
      })
      .catch(() => undefined);
    fetch("/api/ai-commerce/pets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setPets(d.data.pets);
        if (d.data.pets.length === 1) setPetId(d.data.pets[0].id);
      })
      .catch(() => undefined);
  }, []);

  async function activate(tierId: string) {
    if (!petId) {
      setMsg("Selecione um pet.");
      return;
    }
    setBusy(tierId);
    setMsg("");
    const res = await fetch("/api/eccopet-saude/activate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierId, petId }),
    });
    const data = await res.json();
    setBusy(null);
    if (!data.success) {
      setMsg(data.error?.message ?? "Não foi possível ativar.");
      return;
    }
    setMsg(
      data.data.mode === "FREE_BETA"
        ? `Acesso beta de ${data.data.entitlementPeriodDays} dias registrado. Não é cobrança recorrente.`
        : "Plano registrado."
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-sm text-[var(--ep-fg-muted)]">
        <Link href="/marketplace" className="text-ecopet-green hover:underline">
          Marketplace
        </Link>
        {" › "}EccoPet Saúde
      </p>
      <header className="mt-4 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">Vendido pela EccoPet</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Saúde do seu pet em um só lugar.</h1>
        <p className="mt-3 text-[var(--ep-fg-muted)]">
          Prevenção, acompanhamento e acesso a uma rede de cuidados integrada ao EccoPet. Isto não é um produto de seguro.
          Não há recorrência automática neste ambiente.
        </p>
        <aside className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40" role="status">
          <p className="font-medium">Compra paga ainda não está habilitada.</p>
          <p className="mt-1 text-[var(--ep-fg-muted)]">
            SAU-006, SAU-007 e SAU-055 estão CATALOG_ONLY no Pricing Engine (saúde PROVIDER_DEFINED, não produto digital EccoPet).
            Checkout Mercado Pago só quando o item for PURCHASABLE. No beta, o acesso é registrado por 30 dias com renovação
            manual — sem cobrança recorrente.
          </p>
        </aside>
      </header>

      {pets.length > 0 ? (
        <select
          className="mt-6 rounded-2xl border border-[var(--ep-border)] px-3 py-2 text-sm"
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          aria-label="Pet"
        >
          <option value="">Selecionar pet</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(plans ?? []).map((plan) => (
          <article key={plan.tier.id} className="flex flex-col rounded-[20px] border border-[var(--ep-border)] p-5">
            <h2 className="text-xl font-semibold">{plan.tier.name}</h2>
            <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">{plan.tier.description}</p>
            <p className="mt-4 text-2xl font-semibold">
              {(plan.quote.customerAmountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-[var(--ep-fg-muted)]">
              SKU {plan.tier.sku} · {plan.catalogName} · {plan.quote.pricingVersion} · 30 dias
            </p>
            <ul className="mt-4 flex-1 list-disc space-y-1 pl-5 text-sm">
              {plan.tier.includedSkuLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <Button
              className="mt-5"
              loading={busy === plan.tier.id}
              disabled={Boolean(busy)}
              onClick={() => void activate(plan.tier.id)}
            >
              {plan.quote.purchasable ? "Contratar 30 dias" : "Ativar 30 dias no beta"}
            </Button>
            {!plan.quote.purchasable ? (
              <p className="mt-2 text-xs text-[var(--ep-fg-muted)]">
                Item {plan.commercialAvailability}. Checkout Mercado Pago só quando o SKU estiver PURCHASABLE.
              </p>
            ) : null}
          </article>
        ))}
      </div>
      {msg ? (
        <p className="mt-4 text-sm" role="status">
          {msg}
        </p>
      ) : null}

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link className="rounded-2xl border p-4 text-sm" href="/eccopet/checkup">
          Check-up preventivo
        </Link>
        <Link className="rounded-2xl border p-4 text-sm" href="/marketplace/emergencia">
          Emergência com Bubis
        </Link>
        <Link className="rounded-2xl border p-4 text-sm" href="/marketplace/saude/beneficios">
          Meus benefícios / histórico
        </Link>
        <Link className="rounded-2xl border p-4 text-sm" href="/marketplace/servicos?group=health">
          Rede disponível
        </Link>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Plan = {
  tierId?: string;
  sku?: string;
  seller?: string;
  source?: string;
  recurringBilling?: boolean;
  startsAt?: string;
  endsAt?: string;
};

export function EccoPetSaudeBeneficiosPage() {
  const [pets, setPets] = useState<Array<{ id: string; name: string }>>([]);
  const [petId, setPetId] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/ai-commerce/pets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setPets(d.data.pets);
        if (d.data.pets.length === 1) setPetId(d.data.pets[0].id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!petId) return;
    fetch(`/api/ai-commerce/health-profile/${petId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setMsg(d.error?.message ?? "Não foi possível carregar os benefícios.");
          return;
        }
        setPlan((d.data.eccopetSaudePlan as Plan | null) ?? null);
        setMsg("");
      })
      .catch(() => setMsg("Não foi possível carregar os benefícios."));
  }, [petId]);

  const active = plan?.endsAt ? new Date(plan.endsAt).getTime() > Date.now() : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-[var(--ep-fg-muted)]">
        <Link href="/marketplace/saude" className="text-ecopet-green hover:underline">
          EccoPet Saúde
        </Link>
        {" › "}Meus benefícios
      </p>
      <h1 className="mt-4 text-3xl font-semibold">Meus benefícios</h1>
      <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">
        Período comercial registrado no Health Profile. Não é seguro e não há cobrança recorrente automática.
      </p>
      {pets.length > 0 ? (
        <select className="mt-4 rounded-2xl border px-3 py-2 text-sm" value={petId} onChange={(e) => setPetId(e.target.value)}>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-4 text-sm">Cadastre um pet para ver benefícios.</p>
      )}
      {plan ? (
        <article className="mt-6 rounded-[20px] border p-5">
          <p className="text-xs uppercase tracking-wide text-ecopet-green">{plan.seller ?? "ECCOPET"}</p>
          <h2 className="mt-2 text-xl font-semibold">{plan.sku}</h2>
          <p className="mt-2 text-sm">{active ? "Período ativo" : "Período encerrado"}</p>
          <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">
            {plan.startsAt ? new Date(plan.startsAt).toLocaleDateString("pt-BR") : "—"} →{" "}
            {plan.endsAt ? new Date(plan.endsAt).toLocaleDateString("pt-BR") : "—"}
          </p>
          <p className="mt-2 text-xs">Fonte: {plan.source ?? "—"} · Recorrência: {plan.recurringBilling ? "sim" : "não"}</p>
          <Button asChild className="mt-4">
            <Link href="/marketplace/saude">Renovar 30 dias</Link>
          </Button>
        </article>
      ) : (
        <p className="mt-6 text-sm text-[var(--ep-fg-muted)]">Nenhum plano EccoPet Saúde registrado para este pet.</p>
      )}
      {msg ? <p className="mt-3 text-sm text-red-600">{msg}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link className="rounded-full border px-4 py-2" href="/marketplace/servicos?group=health">
          Rede disponível
        </Link>
        <Link className="rounded-full border px-4 py-2" href="/eccopet/health-profile">
          Histórico
        </Link>
        <Link className="rounded-full border px-4 py-2" href="/marketplace/emergencia">
          Emergência
        </Link>
      </div>
    </div>
  );
}

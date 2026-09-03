"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layouts/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Sub = {
  id: string;
  sku: string;
  status: string;
  amountCents: number;
  billingCycle: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
};

export default function ClienteAssinaturasPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [ents, setEnts] = useState<Array<{ id: string; sku: string; status: string }>>([]);
  const [credit, setCredit] = useState(0);

  function load() {
    fetch("/api/commerce/subscriptions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSubs(d.data.subscriptions);
          setCredit(d.data.creditCents ?? 0);
        }
      });
    fetch("/api/commerce/entitlements", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEnts(d.data.entitlements);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    await fetch(`/api/commerce/subscriptions/${id}/cancel`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "USER_CANCEL" }),
    });
    load();
  }

  return (
    <>
      <AppHeader title="Minhas assinaturas" />
      <main className="mx-auto max-w-4xl flex-1 space-y-6 p-4 lg:p-8">
        <p className="text-sm text-muted-foreground">
          Créditos internos: {(credit / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — não sacáveis. Reembolso obrigatório não é substituído por crédito.
        </p>
        <div className="flex gap-3 text-sm">
          <Link href="/assinatura">Planos One</Link>
          <Link href="/marketplace/saude">Saúde</Link>
          <Link href="/cliente/saude">Casos clínicos</Link>
          <Link href="/marketplace/seguro">Seguro</Link>
          <Link href="/marketplace/entretenimento">Entretenimento</Link>
          <Link href="/cliente/financeiro">Financeiro</Link>
        </div>
        {subs.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>
                {s.sku} · {s.status}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-sm">
                {(s.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / {s.billingCycle}
                {s.currentPeriodEnd ? ` · até ${new Date(s.currentPeriodEnd).toLocaleDateString("pt-BR")}` : ""}
              </p>
              {s.status === "ACTIVE" || s.status === "CANCEL_SCHEDULED" ? (
                <Button variant="outline" onClick={() => cancel(s.id)} disabled={s.cancelAtPeriodEnd}>
                  {s.cancelAtPeriodEnd ? "Cancela no fim do período" : "Cancelar"}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
        <h2 className="font-semibold">Entitlements</h2>
        <ul className="space-y-1 text-sm">
          {ents.map((e) => (
            <li key={e.id}>
              {e.sku} — {e.status}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

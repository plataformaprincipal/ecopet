"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MercadoPagoCheckout } from "@/components/features/marketplace/mercado-pago-checkout";

export type CatalogOffer = {
  sku: string;
  name: string;
  description: string;
  family: string;
  status: string;
  billingEnabled: boolean;
  purchasable: boolean;
  recurring: boolean;
  petRequired: boolean;
  terms: string;
  amountCents: number | null;
  annualAmountCents: number | null;
  setupAmountCents: number | null;
  billingCycle: string | null;
  pricingVersion: string;
};

function brl(cents: number | null) {
  if (cents == null) return "Preço pendente";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function CatalogOfferGrid(props: {
  family?: string;
  skus?: string[];
  title: string;
  subtitle: string;
  partner?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<CatalogOffer[]>([]);
  const [pets, setPets] = useState<Array<{ id: string; name: string }>>([]);
  const [petId, setPetId] = useState("");
  const [cycle, setCycle] = useState<"month" | "year">("month");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pay, setPay] = useState<{ orderId: string; total: number } | null>(null);
  const [email, setEmail] = useState("");

  const skuKey = props.skus?.join(",") ?? "";

  useEffect(() => {
    async function load() {
      if (props.skus?.length) {
        const rows: CatalogOffer[] = [];
        for (const sku of props.skus) {
          const res = await fetch(`/api/commerce/catalog?sku=${encodeURIComponent(sku)}`, { credentials: "include" });
          const d = await res.json();
          if (d.success && d.data.item) rows.push(d.data.item);
        }
        setItems(rows);
        return;
      }
      const qs = props.family ? `family=${props.family}` : "";
      const res = await fetch(`/api/commerce/catalog?${qs}`, { credentials: "include" });
      const d = await res.json();
      if (d.success) setItems(d.data.items);
    }
    load().catch(() => undefined);
    fetch("/api/ai-commerce/pets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setPets(d.data.pets ?? []);
        if (d.data.pets?.length === 1) setPetId(d.data.pets[0].id);
      })
      .catch(() => undefined);
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const em = d?.user?.email ?? d?.data?.user?.email;
        if (typeof em === "string") setEmail(em);
      })
      .catch(() => undefined);
  }, [props.family, skuKey]);

  async function buy(sku: string, petRequired: boolean) {
    if (petRequired && !petId) {
      setMsg("Selecione um pet.");
      return;
    }
    setBusy(sku);
    setMsg("");
    const res = await fetch("/api/commerce/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ sku, petId: petRequired ? petId : null, billingCycle: cycle }),
    });
    const data = await res.json();
    setBusy(null);
    if (!data.success) {
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${window.location.pathname}`);
        return;
      }
      setMsg(data.error?.message ?? "Não foi possível contratar.");
      return;
    }
    if (data.data.free) {
      setMsg("Ativado sem cobrança.");
      return;
    }
    setPay({ orderId: data.data.orderId, total: data.data.total });
  }

  return (
    <div className="space-y-6" data-testid={`catalog-offers-${props.family ?? "all"}`}>
      <div>
        <h1 className="font-display text-2xl font-bold">{props.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
      </div>
      {pets.length > 0 ? (
        <label className="block text-sm">
          Pet
          <select className="mt-1 w-full max-w-sm rounded-md border bg-background p-2" value={petId} onChange={(e) => setPetId(e.target.value)}>
            <option value="">Selecione</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="flex gap-2 text-sm">
        <Button type="button" variant={cycle === "month" ? "default" : "outline"} onClick={() => setCycle("month")}>
          Mensal
        </Button>
        <Button type="button" variant={cycle === "year" ? "default" : "outline"} onClick={() => setCycle("year")}>
          Anual
        </Button>
      </div>
      {msg ? <p className="text-sm text-red-600 dark:text-red-400">{msg}</p> : null}
      {pay ? (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento Mercado Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <MercadoPagoCheckout
              orderId={pay.orderId}
              amount={pay.total}
              payerEmail={email}
              onPaid={() => {
                setMsg("Pagamento aprovado. Entitlement será liberado pelo webhook.");
                setPay(null);
                if (props.family === "TELEHEALTH" || props.family === "EXAMS" || props.family === "HEALTH_DIGITAL") {
                  router.push("/cliente/saude");
                }
              }}
              onCancel={() => setPay(null)}
            />
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.sku} className="flex flex-col dark:border-white/10">
            <CardHeader>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.sku}</p>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="text-2xl font-bold">
                {cycle === "year" && item.annualAmountCents ? brl(item.annualAmountCents) : brl(item.amountCents)}
                {item.setupAmountCents ? <span className="block text-sm font-normal">Setup {brl(item.setupAmountCents)}</span> : null}
              </p>
              <p className="text-xs">Status: {item.status}</p>
              <p className="text-xs text-muted-foreground">{item.terms}</p>
              <Button
                disabled={Boolean(busy) || !item.purchasable}
                onClick={() => buy(item.sku, item.petRequired)}
              >
                {item.purchasable ? (busy === item.sku ? "Processando…" : "Contratar") : item.status}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

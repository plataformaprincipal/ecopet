"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";

type Product = {
  sku: string;
  slug: string;
  name: string;
  tag: string;
  shortDescription: string;
  longDescription: string;
  included: string[];
  faqs: Array<{ q: string; a: string }>;
  forWhom: string[];
  howItWorks: string[];
  limitations: string[];
  exampleResult: string;
  billingType: string;
  unitLabel: string;
  usageLimit?: number;
  durationCopy?: string;
  avgFillMinutes: number | null;
  maxImages: number | null;
  purchasable: boolean;
  price: {
    priceInCents: number;
    commercialPending: boolean;
  };
};

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ageLabel(birthDate: string | null) {
  if (!birthDate) return null;
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 ? `${years} anos` : "menos de 1 ano";
}

export function AiProductPage({ slug }: { slug: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [petId, setPetId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const authed = pets !== null;

  useEffect(() => {
    fetch(`/api/ai-commerce/products/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProduct(d.data);
          analyticsService.track(AiEvents.PRODUCT_VIEW, {
            screen: `eccopet_${slug}`,
            label: d.data.sku,
          });
        }
      });
    fetch("/api/ai-commerce/pets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPets(d.data.pets);
          if (d.data.pets.length === 1) setPetId(d.data.pets[0].id);
        } else setPets([]);
      })
      .catch(() => setPets([]));
  }, [slug]);

  useEffect(() => {
    const from = search.get("petId");
    if (from) setPetId(from);
  }, [search]);

  const canBuy = Boolean(product?.purchasable && petId);

  async function addToCart(thenCheckout: boolean) {
    if (!product) return;
    if (!authed) {
      router.push(`/login?callbackUrl=/eccopet/${slug}`);
      return;
    }
    if (!pets?.length) {
      router.push(`/onboarding/pet?callbackUrl=/eccopet/${slug}`);
      return;
    }
    if (!petId) {
      setMsg("Selecione o pet para continuar.");
      return;
    }
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/cart/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: product.sku, petId, quantity: 1 }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.success) {
      if (data.error?.code === "AUTH_REQUIRED") {
        router.push(`/login?callbackUrl=/eccopet/${slug}`);
        return;
      }
      setMsg(data.error?.message ?? "Não foi possível adicionar ao carrinho.");
      return;
    }
    analyticsService.track(thenCheckout ? AiEvents.CHECKOUT_STARTED : AiEvents.ADD_TO_CART, {
      screen: `eccopet_${slug}`,
      label: product.sku,
    });
    router.push(thenCheckout ? "/eccopet/checkout" : "/carrinho");
  }

  const selected = useMemo(() => pets?.find((p) => p.id === petId), [pets, petId]);

  if (!product) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/eccopet" className="text-sm text-ecopet-green hover:underline">
        ← EccoPet AI
      </Link>
      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-ecopet-green">{product.tag}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{product.name}</h1>
      <p className="mt-3 text-base text-muted-foreground">{product.longDescription}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {product.included.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-ecopet-green">✓</span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-3xl font-semibold">{formatPrice(product.price.priceInCents)}</p>
      <p className="text-sm text-muted-foreground">{product.unitLabel}</p>
      {product.durationCopy && <p className="mt-2 max-w-xl text-sm">{product.durationCopy}</p>}
      {product.usageLimit != null && (
        <p className="text-sm text-muted-foreground">Utilizações neste acesso: {product.usageLimit}</p>
      )}
      {product.price.commercialPending ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Preço administrativo — confirmação comercial pendente. Não extraído da planilha oficial.
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-black/5 p-4 dark:border-white/10">
        <p className="text-sm font-medium">Para qual pet você deseja comprar?</p>
        {pets === null && <p className="mt-2 text-sm text-muted-foreground">Carregando pets…</p>}
        {pets && pets.length === 0 && authed && (
          <div className="mt-3">
            <p className="text-sm">Cadastre seu pet antes de continuar.</p>
            <Button asChild className="mt-3">
              <Link href={`/onboarding/pet?callbackUrl=/eccopet/${slug}`}>Cadastrar pet</Link>
            </Button>
          </div>
        )}
        {pets && pets.length > 0 && (
          <select
            className="mt-3 w-full rounded-lg border bg-transparent px-3 py-2"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            aria-label="Selecionar pet"
          >
            <option value="">Selecione</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.breed || p.species} {ageLabel(p.birthDate) ? `· ${ageLabel(p.birthDate)}` : ""}
              </option>
            ))}
          </select>
        )}
        {selected && (
          <p className="mt-2 text-sm text-muted-foreground">
            {selected.name} · {selected.breed || selected.species}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button disabled={busy || (!canBuy && Boolean(pets?.length))} loading={busy} onClick={() => addToCart(false)}>
          Adicionar ao carrinho
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => addToCart(true)}>
          {product.billingType === "SUBSCRIPTION"
            ? "Comprar plano de 30 dias"
            : product.billingType === "ACTIVATION"
              ? "Ativar perfil"
              : "Comprar agora"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Compra segura via Mercado Pago</p>
      {msg && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {msg}
        </p>
      )}

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Como funciona</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {product.howItWorks.map((step, i) => (
            <li key={step} className="rounded-xl border border-black/5 p-4 text-sm dark:border-white/10">
              <span className="font-medium text-ecopet-green">{i + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Exemplo de resultado</h2>
        <p className="mt-2 text-sm text-muted-foreground">{product.exampleResult}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Limitações</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {product.limitations.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Para quem é</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {product.forWhom.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">Não substitui consulta veterinária.</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <dl className="mt-4 space-y-3">
          {product.faqs.map((f) => (
            <div key={f.q} className="rounded-xl border border-black/5 p-4 dark:border-white/10">
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

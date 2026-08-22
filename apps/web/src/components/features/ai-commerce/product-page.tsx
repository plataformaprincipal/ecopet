"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { useTranslation } from "@/providers/i18n-provider";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";

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
  avgFillMinutes: number | null;
  maxImages: number | null;
  free?: boolean;
  requiresPayment?: boolean;
};

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
};

function ageLabel(birthDate: string | null) {
  if (!birthDate) return null;
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 ? `${years} anos` : "menos de 1 ano";
}

export function AiProductPage({ slug }: { slug: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useTranslation();
  const [product, setProduct] = useState<Product | null>(null);
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [petId, setPetId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [guest, setGuest] = useState(false);

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
      .then(async (r) => ({ status: r.status, json: await r.json() }))
      .then(({ status, json }) => {
        if (json.success) {
          setGuest(false);
          setPets(json.data.pets);
          if (json.data.pets.length === 1) setPetId(json.data.pets[0].id);
        } else {
          setPets([]);
          setGuest(status === 401);
        }
      })
      .catch(() => {
        setPets([]);
        setGuest(true);
      });
  }, [slug]);

  useEffect(() => {
    const from = search.get("petId");
    if (from) setPetId(from);
  }, [search]);

  const selected = useMemo(() => pets?.find((p) => p.id === petId), [pets, petId]);

  async function startTool() {
    if (!product) return;
    if (!pets || pets.length === 0) {
      if (guest) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`);
        return;
      }
      router.push(`/onboarding/pet?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`);
      return;
    }
    if (!petId) {
      setMsg(t("ecopetAi.hub.needPet"));
      return;
    }
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/ai-commerce/executions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: product.sku, petId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.success) {
      const code = data.error?.code as string | undefined;
      if (code === "AUTH_REQUIRED" || res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`);
        return;
      }
      if (code === "RATE_LIMIT") {
        setMsg(t("ecopetAi.hub.limitReached"));
        return;
      }
      if (code === "PET_FORBIDDEN") {
        setMsg(t("ecopetAi.hub.needPet"));
        return;
      }
      setMsg(data.error?.message ?? t("ecopetAi.hub.unavailable"));
      return;
    }
    analyticsService.track(AiEvents.EXECUTION_STARTED, {
      screen: `eccopet_${slug}`,
      label: product.sku,
    });
    const def = getProductDefBySku(product.sku);
    router.push(def?.workspaceHref(data.data.executionId) ?? `/eccopet/${slug}/session/${data.data.executionId}`);
  }

  if (!product) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-[var(--ep-fg-muted)]">Carregando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/eccopet" className="text-sm text-ecopet-green hover:underline">
        ← EccoPet AI
      </Link>
      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-ecopet-green">{product.tag}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--ep-fg)]">{product.name}</h1>
      <p className="mt-3 text-base text-[var(--ep-fg-muted)]">{product.longDescription}</p>
      <p className="mt-4 inline-flex rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg-muted)] px-3 py-1 text-xs font-medium">
        {t("ecopetAi.hub.free")}
      </p>
      <ul className="mt-6 space-y-2 text-sm text-[var(--ep-fg)]">
        {product.included.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-ecopet-green">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
        <p className="text-sm font-medium text-[var(--ep-fg)]">{t("ecopetAi.hub.selectPet")}</p>
        {pets === null && <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">Carregando pets…</p>}
        {pets && pets.length === 0 && (
          <div className="mt-3">
            <p className="text-sm text-[var(--ep-fg)]">{t("ecopetAi.hub.needPet")}</p>
            <Button asChild className="mt-3">
              <Link href={`/onboarding/pet?callbackUrl=${encodeURIComponent(`/eccopet/${slug}`)}`}>Cadastrar pet</Link>
            </Button>
          </div>
        )}
        {pets && pets.length > 0 && (
          <select
            className="mt-3 w-full rounded-lg border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-[var(--ep-fg)]"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            aria-label={t("ecopetAi.hub.selectPet")}
          >
            <option value="">{t("ecopetAi.hub.selectPet")}</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.breed || p.species} {ageLabel(p.birthDate) ? `· ${ageLabel(p.birthDate)}` : ""}
              </option>
            ))}
          </select>
        )}
        {selected && (
          <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">
            {selected.name} · {selected.breed || selected.species}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Button disabled={busy} loading={busy} onClick={() => void startTool()}>
          {t("ecopetAi.hub.useNow")}
        </Button>
      </div>
      {msg && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {msg}
        </p>
      )}

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-[var(--ep-fg)]">Como funciona</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {product.howItWorks.map((step, i) => (
            <li key={step} className="rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 text-sm">
              <span className="font-medium text-ecopet-green">{i + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--ep-fg)]">Exemplo de resultado</h2>
        <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">{product.exampleResult}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--ep-fg)]">Limitações</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--ep-fg-muted)]">
          {product.limitations.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--ep-fg)]">FAQ</h2>
        <dl className="mt-4 space-y-3">
          {product.faqs.map((f) => (
            <div key={f.q} className="rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
              <dt className="font-medium text-[var(--ep-fg)]">{f.q}</dt>
              <dd className="mt-1 text-sm text-[var(--ep-fg-muted)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Store, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "./empty-state";
import { useTranslation } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import Link from "next/link";

type FavProduct = { id: string; name: string; price: number; images: string[]; catalogCategory?: string | null };
type FavService = { id: string; name: string; price: number; images?: string[] | null; category?: string | null };
type FavPartner = { id: string; name: string; avatarUrl?: string | null; city?: string | null; state?: string | null };

type LoadState = "loading" | "success" | "empty" | "error";

export function FavoritesPageContent() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<FavProduct[]>([]);
  const [services, setServices] = useState<FavService[]>([]);
  const [partners, setPartners] = useState<FavPartner[]>([]);

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const res = await fetchWithTimeout("/api/favorites", { timeoutMs: 12_000 });
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = "/login?callbackUrl=/marketplace/favoritos";
        return;
      }
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "Não foi possível carregar os favoritos.");
      }
      const data = json.data ?? {};
      const nextProducts = Array.isArray(data.products) ? data.products : [];
      const nextServices = Array.isArray(data.services) ? data.services : [];
      const nextPartners = Array.isArray(data.partners) ? data.partners : [];
      setProducts(nextProducts);
      setServices(nextServices);
      setPartners(nextPartners);
      setState(nextProducts.length + nextServices.length + nextPartners.length === 0 ? "empty" : "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar os favoritos.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(payload: { productId?: string; serviceId?: string; partnerId?: string }) {
    try {
      await fetchWithTimeout("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        timeoutMs: 12_000,
      });
      await load();
    } catch {
      setError("Não foi possível atualizar o favorito.");
    }
  }

  if (state === "loading") {
    return <p className="py-12 text-center text-sm text-[var(--ep-fg-muted)]">Carregando favoritos...</p>;
  }

  if (state === "error") {
    return (
      <div className="rounded-2xl border border-dashed px-4 py-10 text-center">
        <p className="text-sm text-red-600">{error || "Não foi possível carregar os favoritos."}</p>
        <Button className="mt-4" variant="outline" onClick={() => void load()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <EmptyState
        icon={Heart}
        title="Você ainda não adicionou favoritos."
        description="Salve produtos e serviços para encontrá-los rapidamente depois."
        actionLabel="Explorar marketplace"
        href="/marketplace"
      />
    );
  }

  return (
    <Tabs defaultValue="products">
      <TabsList className="mb-6 flex w-full flex-wrap">
        <TabsTrigger value="products">{t("marketplace.favorites.products")} ({products.length})</TabsTrigger>
        <TabsTrigger value="services">{t("marketplace.favorites.services")} ({services.length})</TabsTrigger>
        <TabsTrigger value="partners">{t("marketplace.favorites.partners")} ({partners.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        {products.length === 0 ? (
          <EmptyState icon={Heart} title={t("marketplace.favorites.noProductsTitle")} description={t("marketplace.favorites.noProductsDesc")} actionLabel="Explorar marketplace" href="/marketplace" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article key={p.id} className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
                <Link href={`/marketplace/produto/${p.id}`} className="font-semibold text-[var(--ep-fg)] hover:text-ecopet-green">
                  {p.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">R$ {Number(p.price).toFixed(2)}</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void remove({ productId: p.id })}>
                  <Heart className="mr-1 h-4 w-4 fill-ecopet-green text-ecopet-green" /> Remover
                </Button>
              </article>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="services">
        {services.length === 0 ? (
          <EmptyState icon={Wrench} title={t("marketplace.favorites.noServicesTitle")} description={t("marketplace.favorites.noServicesDesc")} actionLabel="Explorar marketplace" href="/marketplace" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.id} className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
                <Link href={`/marketplace/servico/${s.id}`} className="font-semibold text-[var(--ep-fg)] hover:text-ecopet-green">
                  {s.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">R$ {Number(s.price).toFixed(2)}</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void remove({ serviceId: s.id })}>
                  <Heart className="mr-1 h-4 w-4 fill-ecopet-green text-ecopet-green" /> Remover
                </Button>
              </article>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="partners">
        {partners.length === 0 ? (
          <EmptyState icon={Store} title={t("marketplace.favorites.noPartnersTitle")} description={t("marketplace.favorites.noPartnersDesc")} actionLabel="Explorar marketplace" href="/marketplace" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => (
              <article key={p.id} className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
                <Link href={`/parceiros/${p.id}`} className="font-semibold text-[var(--ep-fg)] hover:text-ecopet-green">
                  {p.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">
                  {[p.city, p.state].filter(Boolean).join(" / ") || "Parceiro"}
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void remove({ partnerId: p.id })}>
                  <Heart className="mr-1 h-4 w-4 fill-ecopet-green text-ecopet-green" /> Remover
                </Button>
              </article>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

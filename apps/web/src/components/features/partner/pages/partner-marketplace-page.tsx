"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Package, Pause, Play, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerPageHeader } from "../partner-page-header";
import { PartnerEmptyState } from "../partner-empty-state";
import { PartnerCardSkeleton } from "../partner-skeleton";
import { PartnerProductStatusBadge } from "../partner-status-badge";
import {
  getPartnerProductDisplayStatus,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_VARIANTS,
} from "@/lib/partner/product-status";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  catalogCategory: string | null;
  status: string;
  approvalStatus: string;
  images?: unknown;
};

function productImage(images: unknown): string | null {
  if (!images || !Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === "string") return first;
  if (typeof first === "object" && first && "url" in first) return String((first as { url: string }).url);
  return null;
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PartnerMarketplacePage() {
  const [tab, setTab] = useState<"mine" | "platform">("mine");
  const [myProducts, setMyProducts] = useState<ProductRow[]>([]);
  const [platformProducts, setPlatformProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, platformRes] = await Promise.all([
        fetch("/api/partner/products", { credentials: "include" }),
        fetch("/api/partner/platform-products", { credentials: "include" }),
      ]);
      const mineJson = await mineRes.json();
      const platformJson = await platformRes.json();
      if (mineJson.success) setMyProducts(mineJson.data.products ?? []);
      if (platformJson.success) setPlatformProducts(platformJson.data.products ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(productId: string, status: string) {
    setActionId(productId);
    try {
      const res = await fetch(`/api/partner/products/${productId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await load();
    } finally {
      setActionId(null);
    }
  }

  async function removeProduct(productId: string) {
    if (!confirm("Remover este produto da vitrine?")) return;
    setActionId(productId);
    try {
      const res = await fetch(`/api/partner/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) await load();
    } finally {
      setActionId(null);
    }
  }

  const products = tab === "mine" ? myProducts : platformProducts;

  return (
    <div className="space-y-6">
      <PartnerPageHeader
        title="Vitrine e Marketplace"
        description="Gerencie seus produtos cadastrados e explore o catálogo oficial EcoPet disponível para parceiros."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/dashboard/partner/products/new">
              <Plus className="h-4 w-4" />
              Cadastrar produto
            </Link>
          </Button>
        }
      />

      <div className="inline-flex rounded-xl border border-zinc-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        {[
          { key: "mine" as const, label: "Meus produtos" },
          { key: "platform" as const, label: "Produtos EcoPet" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <PartnerCardSkeleton count={6} />
      ) : products.length === 0 ? (
        <PartnerEmptyState
          icon={Package}
          title={tab === "mine" ? "Nenhum produto cadastrado" : "Catálogo EcoPet vazio"}
          description={
            tab === "mine"
              ? "Cadastre seu primeiro produto para exibir na vitrine do marketplace."
              : "Não há produtos oficiais da plataforma disponíveis no momento."
          }
          actionLabel={tab === "mine" ? "Cadastrar produto" : undefined}
          actionHref={tab === "mine" ? "/dashboard/partner/products/new" : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const displayStatus = getPartnerProductDisplayStatus({
              status: product.status as "ACTIVE" | "INACTIVE" | "DRAFT" | "OUT_OF_STOCK",
              approvalStatus: product.approvalStatus as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED",
              stock: product.stock,
            });
            const img = productImage(product.images);
            const isMine = tab === "mine";
            const busy = actionId === product.id;

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                      <Package className="h-10 w-10 opacity-40" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <PartnerProductStatusBadge
                      label={PRODUCT_STATUS_LABELS[displayStatus]}
                      variant={PRODUCT_STATUS_VARIANTS[displayStatus]}
                    />
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-white">{product.name}</h3>
                    <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {product.catalogCategory ?? "Sem categoria"} · Estoque: {product.stock}
                    </p>
                  </div>
                  {isMine ? (
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="h-8 gap-1">
                        <Link href={`/dashboard/partner/products/${product.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </Button>
                      {product.status !== "ACTIVE" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          disabled={busy}
                          onClick={() => updateStatus(product.id, "ACTIVE")}
                        >
                          <Play className="h-3.5 w-3.5" />
                          Ativar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          disabled={busy}
                          onClick={() => updateStatus(product.id, "INACTIVE")}
                        >
                          <Pause className="h-3.5 w-3.5" />
                          Pausar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-600 hover:text-red-700"
                        disabled={busy}
                        onClick={() => removeProduct(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/marketplace/produto/${product.id}`}>Ver no marketplace</Link>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

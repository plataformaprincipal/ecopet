"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { firstProductImageUrl, resolveProductAlt } from "@/lib/catalog/images";

const CATEGORY_OPTIONS = [
  { value: "", label: "Todas as categorias" },
  { value: "ACCESSORIES", label: "Acessórios" },
  { value: "FOOD", label: "Rações" },
  { value: "HYGIENE", label: "Higiene" },
  { value: "TOYS", label: "Brinquedos" },
  { value: "HEALTH", label: "Saúde" },
];

type Product = {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  catalogCategory?: string;
  sku?: string;
  images?: string[];
  extraDetails?: { imageAlt?: string };
  seller?: { partnerProfile?: { businessName?: string; city?: string } };
};

export function PublicProductsList({ detailBase = "/produtos" }: { detailBase?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    fetch(`/api/public/products?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProducts(d.data.products);
      })
      .finally(() => setLoading(false));
  }, [q, category]);

  async function addToCart(productId: string) {
    setCartMsg("");
    const res = await fetch("/api/cart/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await res.json();
    if (data.success) setCartMsg("Produto adicionado ao carrinho.");
    else setCartMsg(data.error?.message ?? "Faça login para adicionar ao carrinho.");
  }

  if (loading) return <p className="text-sm">Carregando produtos...</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Buscar produtos..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          className="rounded border px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value || "all"} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {cartMsg && <p className="text-sm text-muted-foreground">{cartMsg}</p>}
      {products.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum produto disponível.
        </p>
      ) : (
        products.map((p) => {
          const imageUrl = firstProductImageUrl(p.images);
          const alt = resolveProductAlt(p.name, p.sku, p.shortDescription, p.extraDetails);
          return (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-start gap-4 p-4">
                {imageUrl && (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted/30">
                    <Image src={imageUrl} alt={alt} fill className="object-contain p-1" unoptimized />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.shortDescription ?? p.description}</p>
                  <p className="mt-1 text-sm">
                    R$ {p.price.toFixed(2)}
                    {p.comparePrice && p.comparePrice < p.price ? (
                      <span className="ml-2 text-muted-foreground line-through">
                        R$ {p.comparePrice.toFixed(2)}
                      </span>
                    ) : null}
                    {" · "}estoque: {p.stock}
                  </p>
                  {p.seller?.partnerProfile?.businessName && (
                    <p className="text-xs text-muted-foreground">{p.seller.partnerProfile.businessName}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${detailBase}/${p.id}`}>Ver detalhes</Link>
                  </Button>
                  <Button size="sm" disabled={p.stock <= 0} onClick={() => addToCart(p.id)}>
                    Carrinho
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
      <Button asChild variant="ghost">
        <Link href="/carrinho">Ir ao carrinho</Link>
      </Button>
    </div>
  );
}

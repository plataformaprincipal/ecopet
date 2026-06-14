"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  reviewCount: number;
  catalogCategory?: string;
  seller?: { partnerProfile?: { businessName?: string; city?: string } };
};

export function PublicProductsList({ detailBase = "/produtos" }: { detailBase?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    fetch(`/api/public/products?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data.products); })
      .finally(() => setLoading(false));
  }, [q]);

  if (loading) return <p className="text-sm">Carregando produtos...</p>;

  return (
    <div className="space-y-4">
      <Input placeholder="Buscar produtos..." value={q} onChange={(e) => setQ(e.target.value)} />
      {products.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum produto disponível.
        </p>
      ) : products.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex justify-between p-4">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <p className="text-sm">R$ {p.price.toFixed(2)} · estoque: {p.stock}</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link href={`${detailBase}/${p.id}`}>Ver</Link></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

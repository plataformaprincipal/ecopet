"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveServiceAlt } from "@/lib/catalog/images";

type Service = {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
  image?: string | null;
  extraDetails?: { catalogKey?: string; imageAlt?: string };
  provider?: { partnerProfile?: { businessName?: string; city?: string; state?: string } };
};

export function PublicServicesList({ detailBase = "/servicos" }: { detailBase?: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    fetch(`/api/public/services?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setServices(d.data.services);
          setTotal(d.data.total);
        }
      })
      .finally(() => setLoading(false));
  }, [q]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando serviços...</p>;

  return (
    <div className="space-y-4">
      <Input placeholder="Buscar serviços..." value={q} onChange={(e) => setQ(e.target.value)} />
      {services.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum serviço disponível na sua região.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total} serviço(s) encontrado(s)</p>
          {services.map((s) => {
            const catalogKey = s.extraDetails?.catalogKey;
            const alt = resolveServiceAlt(s.name, catalogKey, s.shortDescription, s.extraDetails);
            return (
              <Card key={s.id}>
                <CardContent className="flex gap-4 p-4">
                  {s.image && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted/30">
                      <Image src={s.image} alt={alt} fill className="object-contain p-1" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{s.shortDescription ?? s.description}</p>
                    <p className="text-sm">
                      R$ {s.price.toFixed(2)} · ⭐ {s.rating.toFixed(1)} ({s.reviewCount})
                    </p>
                    {s.provider?.partnerProfile?.city && (
                      <p className="text-xs text-muted-foreground">
                        {s.provider.partnerProfile.city} — {s.provider.partnerProfile.state}
                      </p>
                    )}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${detailBase}/${s.id}`}>Ver</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

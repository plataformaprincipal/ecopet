"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
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
          {services.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  <p className="text-sm">R$ {s.price.toFixed(2)} · ⭐ {s.rating.toFixed(1)} ({s.reviewCount})</p>
                  {s.provider?.partnerProfile?.city && (
                    <p className="text-xs text-muted-foreground">{s.provider.partnerProfile.city} — {s.provider.partnerProfile.state}</p>
                  )}
                </div>
                <Button asChild size="sm" variant="outline"><Link href={`${detailBase}/${s.id}`}>Ver</Link></Button>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

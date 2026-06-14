"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function LojaPublicPage() {
  const params = useParams();
  const partnerId = String(params.partnerId);
  const [partner, setPartner] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/public/partners/${partnerId}`).then((r) => r.json()).then((d) => {
      if (d.success) setPartner(d.data.partner);
    });
  }, [partnerId]);

  if (!partner) return <main className="p-6">Carregando...</main>;
  const products = (partner.products as { id: string; name: string; price: number }[]) ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{String(partner.businessName)}</h1>
      <p className="text-sm text-muted-foreground">{String(partner.city)} — {String(partner.state)}</p>
      {products.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum produto disponível.</p>
      ) : products.map((p) => (
        <Card key={p.id}><CardContent className="flex justify-between p-4 text-sm">
          <span>{p.name} — R$ {p.price.toFixed(2)}</span>
          <Link href={`/produtos/${p.id}`} className="underline">Ver</Link>
        </CardContent></Card>
      ))}
      <Link href="/produtos" className="text-sm underline">Voltar</Link>
    </main>
  );
}

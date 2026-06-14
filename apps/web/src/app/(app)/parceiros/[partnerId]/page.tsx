"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function ParceiroPublicPage() {
  const params = useParams();
  const partnerId = String(params.partnerId);
  const [partner, setPartner] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/public/partners/${partnerId}`).then((r) => r.json()).then((d) => {
      if (d.success) setPartner(d.data.partner);
    });
  }, [partnerId]);

  if (!partner) return <main className="p-6">Carregando...</main>;

  const services = (partner.services as unknown[]) ?? [];
  const reviews = (partner.reviews as unknown[]) ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{String(partner.businessName)}</h1>
      {partner.description ? <p className="text-sm">{String(partner.description)}</p> : null}
      <p className="text-sm text-muted-foreground">{String(partner.city)} — {String(partner.state)}</p>
      <p className="text-sm">⭐ {Number(partner.rating).toFixed(1)} ({Number(partner.reviewCount)} avaliações)</p>
      <Card><CardContent className="p-4 text-sm">{services.length === 0 ? "Nenhum serviço ativo." : `${services.length} serviço(s) ativo(s)`}</CardContent></Card>
      <Card><CardContent className="p-4 text-sm">{reviews.length === 0 ? "Nenhuma avaliação ainda." : `${reviews.length} avaliação(ões)`}</CardContent></Card>
      <Link href="/servicos" className="text-sm underline">Voltar aos serviços</Link>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PublicServiceDetail() {
  const params = useParams();
  const id = String(params.serviceId);
  const [service, setService] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/public/services/${id}`).then((r) => r.json()).then((d) => {
      if (d.success) setService(d.data.service);
    });
  }, [id]);

  if (!service) return <p>Carregando...</p>;

  const provider = service.provider as Record<string, unknown> | undefined;
  const profile = provider?.partnerProfile as Record<string, string> | undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">{String(service.name)}</h1>
        <p>{String(service.description)}</p>
        <p className="font-medium">R$ {Number(service.price).toFixed(2)}</p>
        <p className="text-sm">⭐ {Number(service.rating).toFixed(1)} ({Number(service.reviewCount)} avaliações)</p>
        {profile && <p className="text-sm text-muted-foreground">{profile.businessName} — {profile.city}/{profile.state}</p>}
        <div className="flex gap-2">
          {provider?.id ? (
            <Button asChild variant="outline"><Link href={`/parceiros/${String(provider.id)}`}>Ver parceiro</Link></Button>
          ) : null}
          <Button asChild><Link href={`/login?callbackUrl=/dashboard/client/appointments/new?serviceId=${id}`}>Agendar</Link></Button>
        </div>
        <Button asChild variant="ghost"><Link href="/servicos">Voltar</Link></Button>
      </CardContent>
    </Card>
  );
}

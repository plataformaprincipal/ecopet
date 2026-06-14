"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ClientServiceDetailPanel() {
  const params = useParams();
  const serviceId = String(params.serviceId);
  const [service, setService] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/client/services/${serviceId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setService(d.data.service); });
  }, [serviceId]);

  if (!service) return <p className="text-sm">Carregando...</p>;

  return (
    <Card>
      <CardContent className="space-y-3 p-4 text-sm">
        <p className="text-lg font-medium">{String(service.name)}</p>
        <p>{String(service.description)}</p>
        <p>Preço: R$ {Number(service.price).toFixed(2)}</p>
        <Button asChild><Link href={`/dashboard/client/appointments/new?serviceId=${serviceId}`}>Agendar</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/client/services">Voltar</Link></Button>
      </CardContent>
    </Card>
  );
}

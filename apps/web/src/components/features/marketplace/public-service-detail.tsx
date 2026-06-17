"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { resolveServiceAlt } from "@/lib/catalog/images";

export function PublicServiceDetail() {
  const params = useParams();
  const id = String(params.serviceId);
  const { user } = useFoundationSession();
  const [service, setService] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/public/services/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setService(d.data.service);
      });
  }, [id]);

  if (!service) return <p>Carregando...</p>;

  const provider = service.provider as Record<string, unknown> | undefined;
  const profile = provider?.partnerProfile as Record<string, string> | undefined;
  const extra = service.extraDetails as { observations?: string; catalogKey?: string; imageAlt?: string } | null;
  const image = typeof service.image === "string" ? service.image : null;
  const alt = resolveServiceAlt(
    String(service.name),
    extra?.catalogKey,
    service.shortDescription ? String(service.shortDescription) : null,
    extra
  );
  const bookHref = user
    ? `/dashboard/client/appointments/new?serviceId=${id}`
    : `/login?callbackUrl=${encodeURIComponent(`/dashboard/client/appointments/new?serviceId=${id}`)}`;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        {image && (
          <div className="relative mx-auto aspect-video max-w-md overflow-hidden rounded-xl border bg-muted/20">
            <Image src={image} alt={alt} fill className="object-contain p-4" priority unoptimized />
          </div>
        )}
        <h1 className="text-2xl font-semibold">{String(service.name)}</h1>
        {service.shortDescription ? (
          <p className="text-muted-foreground">{String(service.shortDescription)}</p>
        ) : null}
        <p>{String(service.description)}</p>
        <p className="font-medium">
          {Number(service.price) > 0 ? `R$ ${Number(service.price).toFixed(2)}` : "Sob consulta"}
        </p>
        {service.durationMin ? (
          <p className="text-sm">Duração: {Number(service.durationMin)} minutos</p>
        ) : null}
        {profile && (
          <p className="text-sm text-muted-foreground">
            {profile.businessName} — {profile.city}/{profile.state}
          </p>
        )}
        {extra?.observations && <p className="text-sm">{extra.observations}</p>}
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={bookHref}>Agendar</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/servicos">Voltar</Link>
          </Button>
        </div>
        {!user && (
          <p className="text-xs text-muted-foreground">
            Faça login para agendar. Visitantes podem visualizar serviços sem cadastro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

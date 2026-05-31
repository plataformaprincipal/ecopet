"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Heart, Home, MessageCircle, ChevronLeft, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./rating-stars";
import { ServiceCard } from "./service-card";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { fetchService, fetchReviews, fetchRelatedServices } from "@/lib/marketplace/api";
import { formatMpPrice, AI_TAG_LABELS } from "@/lib/marketplace/config";
import type { MarketplaceService, MarketplaceReview } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

interface ServiceDetailContentProps {
  id: string;
}

export function ServiceDetailContent({ id }: ServiceDetailContentProps) {
  const { addToCart, toggleFavoriteService, isFavoriteService } = useMarketplaceStore();
  const [service, setService] = useState<MarketplaceService | undefined>();
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [related, setRelated] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    Promise.all([
      fetchService(id),
      fetchReviews(id),
      fetchRelatedServices(id),
    ]).then(([s, r, rel]) => {
      setService(s);
      setReviews(r);
      setRelated(rel);
      if (s?.availableDates?.[0]) setSelectedDate(s.availableDates[0]);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="animate-pulse h-96 rounded-2xl bg-ecopet-gray/10" />;
  if (!service) return <p className="text-ecopet-gray">Serviço não encontrado.</p>;

  const fav = isFavoriteService(service.id);

  return (
    <div>
      <Link href="/marketplace/servicos" className="mb-4 inline-flex items-center gap-1 text-sm text-ecopet-green">
        <ChevronLeft className="h-4 w-4" /> Voltar aos serviços
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100">
          <Image src={service.image} alt={service.name} fill className="object-cover" priority />
          {service.emergency && <Badge className="absolute left-3 top-3 bg-red-500 text-white">Emergência</Badge>}
        </div>

        <div>
          {service.aiTag && <Badge variant="premium" className="mb-2">{AI_TAG_LABELS[service.aiTag]}</Badge>}
          <h1 className="font-display text-2xl font-bold lg:text-3xl">{service.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={service.rating} size="md" />
            <span className="text-sm text-ecopet-gray">({service.reviewCount})</span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-ecopet-green">{formatMpPrice(service.price)}</p>
          <p className="mt-4 text-ecopet-gray">{service.description}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> ~{service.durationMin} min</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {service.partner.location}</span>
            {service.homeService && <span className="flex items-center gap-1"><Home className="h-4 w-4" /> Domicílio</span>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {service.inPerson && <Badge>Presencial</Badge>}
            {service.telehealth && <Badge>Teleatendimento</Badge>}
          </div>

          <Link href={`/marketplace/parceiro/${service.partnerId}`} className="mt-4 inline-flex items-center gap-2 rounded-xl border p-3 hover:border-ecopet-green">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image src={service.partner.avatar} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">{service.partner.name}</p>
              <p className="text-xs text-ecopet-gray">{service.partner.distanceKm} km</p>
            </div>
          </Link>

          {service.availableDates && service.availableDates.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Datas disponíveis</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {service.availableDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm",
                      selectedDate === d ? "border-ecopet-green bg-ecopet-green/10" : "hover:border-ecopet-green/50"
                    )}
                  >
                    {new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => addToCart({
                type: "service", itemId: service.id, name: service.name, image: service.image,
                price: service.price, quantity: 1, partnerId: service.partnerId, partnerName: service.partner.name,
                scheduledAt: selectedDate,
              })}
            >
              <Calendar className="h-5 w-5" /> Agendar
            </Button>
            <Button size="lg" variant="outline"><MessageCircle className="h-5 w-5" /></Button>
            <Button size="lg" variant="outline" className={cn(fav && "text-red-500")} onClick={() => toggleFavoriteService(service.id)}>
              <Heart className={cn("h-5 w-5", fav && "fill-red-500")} />
            </Button>
          </div>

          <Link href="/marketplace/personalizados" className="mt-3 block">
            <Button variant="ghost" className="w-full">Solicitar orçamento personalizado</Button>
          </Link>
        </div>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="font-bold">Política de cancelamento</h3>
          <p className="mt-2 text-sm text-ecopet-gray">Cancelamento gratuito até 2h antes do horário agendado. Reagendamento disponível 1x sem custo.</p>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h3 className="mb-4 font-bold">Avaliações</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-ecopet-gray">Sem avaliações ainda.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="mb-3 rounded-xl border p-4">
              <RatingStars rating={r.rating} />
              <p className="mt-2 text-sm">{r.comment}</p>
            </div>
          ))
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-4 font-bold">Serviços relacionados</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((s) => <ServiceCard key={s.id} service={s} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}

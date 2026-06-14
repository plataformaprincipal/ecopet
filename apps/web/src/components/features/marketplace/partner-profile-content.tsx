"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Heart, MessageCircle, Share2, Flag, MapPin, Clock, BadgeCheck, Star,
  Shield, BarChart3, Settings, Sparkles, Package, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "./product-card";
import { ServiceCard } from "./service-card";
import { RatingStars } from "./rating-stars";
import { EmptyState } from "./empty-state";
import { CustomQuoteCard } from "@/components/features/ecosystem/quotes/custom-quote-card";
import { QualityControlPanel } from "@/components/features/ecosystem/partner/quality-control-panel";
import { ChatHub } from "@/components/features/ecosystem/chat/chat-hub";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { fetchPartner, fetchPartnerProducts, fetchPartnerServices, fetchReviews } from "@/lib/marketplace/api";
import { getQuotesForPartner } from "@/lib/ecosystem/quotes-api";
import type { MarketplacePartner, MarketplaceProduct, MarketplaceService, MarketplaceReview } from "@/lib/marketplace/types";
import type { CustomQuote } from "@/lib/ecosystem/types";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  petshop: "Pet Shop", clinic: "Clínica Veterinária", veterinarian: "Veterinário",
  provider: "Prestador de Serviço", ong: "ONG", seller: "Seller", store: "Loja Parceira",
};

interface PartnerProfileContentProps {
  id: string;
  expanded?: boolean;
  tabOnly?: "portfolio" | "reviews" | "policies" | "about";
}

export function PartnerProfileContent({ id, expanded, tabOnly }: PartnerProfileContentProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "overview";
  const { toggleFavoritePartner, isFavoritePartner, addQuoteToCart } = useMarketplaceStore();
  const [partner, setPartner] = useState<MarketplacePartner | undefined>();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchPartner(id),
      fetchPartnerProducts(id),
      fetchPartnerServices(id),
      fetchReviews(id),
    ]).then(([p, pr, sv, rv]) => {
      setPartner(p);
      setProducts(pr);
      setServices(sv);
      setReviews(rv);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-48 rounded-2xl bg-ecopet-gray/10" /><div className="h-32 rounded-2xl bg-ecopet-gray/10" /></div>;
  if (!partner) return <p className="text-ecopet-gray">Parceiro não encontrado.</p>;

  const fav = isFavoritePartner(partner.id);
  const filteredReviews = reviewFilter > 0 ? reviews.filter((r) => r.rating >= reviewFilter) : reviews;
  const partnerQuotes = getQuotesForPartner(id);
  const qualityIndex = partner.qualityIndex ?? Math.round(partner.rating * 20);
  const isOpen = partner.isOpen ?? true;

  if (tabOnly) {
    return renderTabContent(tabOnly, { partner, products, services, reviews, filteredReviews, reviewFilter, setReviewFilter, partnerQuotes, addQuoteToCart });
  }

  return (
    <div>
      <div className="relative h-40 overflow-hidden rounded-2xl lg:h-56">
        <Image src={partner.cover} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative -mt-12 px-4 lg:-mt-16 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg dark:border-[#0f1419] lg:h-28 lg:w-28">
              <Image src={partner.avatar} alt={partner.name} fill className="object-cover" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold lg:text-2xl">{partner.tradeName}</h1>
                {partner.isVerified && <Badge variant="verified"><BadgeCheck className="h-3 w-3" /> Verificado</Badge>}
                <Badge variant={isOpen ? "default" : "secondary"} className={cn(isOpen ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-600")}>
                  {isOpen ? "Aberto" : "Fechado"}
                </Badge>
              </div>
              <p className="text-sm text-ecopet-gray">{TYPE_LABELS[partner.type]}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="default" asChild><Link href={`/marketplace/chat?partner=${partner.id}`}><MessageCircle className="h-4 w-4" /> Conversar</Link></Button>
            <Button size="sm" variant={fav ? "default" : "outline"} onClick={() => toggleFavoritePartner(partner.id)}>
              <Heart className={cn("h-4 w-4", fav && "fill-white")} /> Seguir
            </Button>
            <Button size="sm" variant="outline" asChild><Link href={`/marketplace/personalizados?partner=${partner.id}`}><Sparkles className="h-4 w-4" /> Contratar</Link></Button>
            {expanded && (
              <Button size="sm" variant="ghost" asChild><Link href={`/marketplace/parceiro/${partner.id}?manage=1`}><Settings className="h-4 w-4" /> Gestão</Link></Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatPill label="Nota" value={`${partner.rating}★`} />
          <StatPill label="Vendas/serviços" value={partner.salesCount.toLocaleString()} />
          <StatPill label="Qualidade" value={`${qualityIndex}%`} icon={Shield} />
          <StatPill label="Resposta" value={partner.responseTime} icon={Clock} />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-ecopet-gray">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {partner.location} · {partner.distanceKm} km</span>
          <span>{partner.reviewCount} avaliações</span>
          <span>Conclusão {partner.completionRate ?? 96}%</span>
        </div>

        <p className="mt-3 text-sm text-ecopet-gray">{partner.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {partner.categories.map((c) => <Badge key={c} variant="default">{c}</Badge>)}
        </div>
        <p className="mt-2 text-xs text-ecopet-gray">Horário: {partner.hours}</p>
      </div>

      <Tabs defaultValue={defaultTab === "products" || defaultTab === "services" ? defaultTab : "overview"} className="mt-8">
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="products">Produtos ({products.length})</TabsTrigger>
          <TabsTrigger value="services">Serviços ({services.length})</TabsTrigger>
          <TabsTrigger value="custom">Personalizados</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          {expanded && <TabsTrigger value="quality">Qualidade</TabsTrigger>}
          {expanded && <TabsTrigger value="chat">Chat</TabsTrigger>}
          {expanded && <TabsTrigger value="metrics">Métricas</TabsTrigger>}
          <TabsTrigger value="about">Sobre</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {products.slice(0, 2).length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><Package className="h-4 w-4" /> Produtos em destaque</h3>
                <div className="grid gap-3 sm:grid-cols-2">{products.slice(0, 2).map((p) => <ProductCard key={p.id} product={p} compact />)}</div>
              </div>
            )}
            {services.slice(0, 2).length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4" /> Serviços populares</h3>
                <div className="grid gap-3">{services.slice(0, 2).map((s) => <ServiceCard key={s.id} service={s} />)}</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          {products.length === 0 ? (
            <EmptyState icon={Package} title="Sem produtos" description="Este parceiro ainda não cadastrou produtos." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          {services.length === 0 ? (
            <EmptyState icon={Package} title="Sem serviços" description="Este parceiro ainda não cadastrou serviços." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="mt-6 space-y-4">
          <div className="rounded-[16px] border border-ecopet-yellow/30 bg-ecopet-yellow/5 p-4">
            <p className="font-semibold">Serviço personalizado via chat</p>
            <p className="mt-1 text-sm text-ecopet-gray">Descreva sua necessidade, receba orçamento e compre dentro do prazo.</p>
            <Button className="mt-3" size="sm" asChild>
              <Link href={`/marketplace/chat?partner=${partner.id}&type=custom_quote`}>Solicitar serviço personalizado</Link>
            </Button>
          </div>
          {partnerQuotes.map((q) => (
            <CustomQuoteCard key={q.id} quote={q} onAddToCart={addQuoteToCart} />
          ))}
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          {renderTabContent("portfolio", { partner, products, services, reviews, filteredReviews, reviewFilter, setReviewFilter, partnerQuotes, addQuoteToCart })}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {renderTabContent("reviews", { partner, products, services, reviews, filteredReviews, reviewFilter, setReviewFilter, partnerQuotes, addQuoteToCart })}
        </TabsContent>

        {expanded && (
          <TabsContent value="quality" className="mt-6"><QualityControlPanel /></TabsContent>
        )}

        {expanded && (
          <TabsContent value="chat" className="mt-6"><ChatHub role="partner" /></TabsContent>
        )}

        {expanded && (
          <TabsContent value="metrics" className="mt-6">
            <div className="rounded-[16px] border border-ecopet-green/20 p-6 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-ecopet-green" />
              <p className="mt-2 font-semibold">Métricas e Insights</p>
              <Button className="mt-3" asChild><Link href="/insights?scope=partner">Abrir painel completo</Link></Button>
            </div>
          </TabsContent>
        )}

        <TabsContent value="about" className="mt-6">
          {renderTabContent("about", { partner, products, services, reviews, filteredReviews, reviewFilter, setReviewFilter, partnerQuotes, addQuoteToCart })}
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          {renderTabContent("policies", { partner, products, services, reviews, filteredReviews, reviewFilter, setReviewFilter, partnerQuotes, addQuoteToCart })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatPill({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Shield }) {
  return (
    <div className="rounded-xl border border-ecopet-gray/10 bg-ecopet-gray/5 px-3 py-2 text-center dark:bg-white/5">
      {Icon && <Icon className="mx-auto h-4 w-4 text-ecopet-green" />}
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-[10px] text-ecopet-gray">{label}</p>
    </div>
  );
}

function renderTabContent(
  tab: string,
  ctx: {
    partner: MarketplacePartner;
    products: MarketplaceProduct[];
    services: MarketplaceService[];
    reviews: MarketplaceReview[];
    filteredReviews: MarketplaceReview[];
    reviewFilter: number;
    setReviewFilter: (n: number) => void;
    partnerQuotes: CustomQuote[];
    addQuoteToCart: (id: string) => void;
  }
) {
  const { partner, reviews, filteredReviews, reviewFilter, setReviewFilter } = ctx;

  switch (tab) {
    case "portfolio":
      return partner.portfolio.length === 0 ? (
        <EmptyState icon={Package} title="Portfólio vazio" description="Fotos e cases serão exibidos aqui." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partner.portfolio.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl">
              <div className="relative aspect-video">
                <Image src={item.url} alt={item.caption ?? ""} fill className="object-cover" />
              </div>
              {item.caption && <p className="p-2 text-sm text-ecopet-gray">{item.caption}</p>}
            </div>
          ))}
        </div>
      );
    case "reviews":
      return (
        <>
          <div className="mb-4 flex gap-2">
            {[0, 5, 4, 3].map((n) => (
              <button key={n} type="button" onClick={() => setReviewFilter(n)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", reviewFilter === n ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}>
                {n === 0 ? "Todas" : `${n}★+`}
              </button>
            ))}
          </div>
          {filteredReviews.length === 0 ? (
            <EmptyState icon={Star} title="Sem avaliações" description="Este parceiro ainda não recebeu avaliações." />
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((r) => (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full">
                      <Image src={r.avatar} alt="" fill className="object-cover" />
                    </div>
                    <span className="text-sm font-semibold">{r.author}</span>
                    <RatingStars rating={r.rating} />
                  </div>
                  <p className="mt-2 text-sm">{r.comment}</p>
                  {r.partnerReply && <p className="mt-2 rounded-lg bg-ecopet-green/5 p-2 text-xs">Resposta: {r.partnerReply}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      );
    case "about":
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p>{partner.description}</p>
          <h3 className="mt-4 font-semibold">Áreas atendidas</h3>
          <p>{partner.categories.join(", ")}</p>
        </div>
      );
    case "policies":
      return (
        <dl className="space-y-4">
          {Object.entries(partner.policies).map(([key, val]) => val && (
            <div key={key}>
              <dt className="font-semibold capitalize">{key === "delivery" ? "Entrega" : key === "exchange" ? "Troca" : key === "cancellation" ? "Cancelamento" : key === "refund" ? "Reembolso" : "Garantia"}</dt>
              <dd className="mt-1 text-sm text-ecopet-gray">{val}</dd>
            </div>
          ))}
        </dl>
      );
    default:
      return null;
  }
}

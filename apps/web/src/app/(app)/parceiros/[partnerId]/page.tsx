"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Star, Package, Scissors, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartConversationButton } from "@/components/messages/StartConversationButton";
import { useTranslation } from "@/providers/i18n-provider";

type PartnerData = {
  id: string;
  businessName: string;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  category?: string | null;
  rating: number;
  reviewCount: number;
  products: Array<{ id: string; name: string; price: number }>;
  services: Array<{ id: string; name: string; price: number }>;
  reviews: Array<{ rating: number; comment?: string | null; user: { name: string } }>;
  slug?: string;
};

export default function ParceiroPublicPage() {
  const params = useParams();
  const slugOrId = String(params.partnerId);
  const { t } = useTranslation();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketplace/partners/${slugOrId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPartner(d.data.partner as PartnerData);
      })
      .finally(() => setLoading(false));
  }, [slugOrId]);

  if (loading) {
    return <main className="p-6 text-sm text-muted-foreground" role="status">{t("marketplace.loading")}</main>;
  }

  if (!partner) {
    return (
      <main className="mx-auto max-w-2xl p-6 text-center">
        <p>{t("marketplace.partnerNotFound")}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/marketplace/parceiros">{t("marketplace.backToPartners")}</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
      <header className="rounded-2xl border bg-white p-6 dark:bg-[#0f1419]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{partner.businessName}</h1>
            {partner.category && <p className="text-sm text-ecopet-green">{partner.category}</p>}
            {partner.description && <p className="mt-2 text-sm text-muted-foreground">{partner.description}</p>}
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden />
              {[partner.city, partner.state].filter(Boolean).join(", ")}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              {partner.rating.toFixed(1)} ({partner.reviewCount} {t("marketplace.reviews")})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StartConversationButton
              participantUserId={partner.id}
              contextType="GENERAL"
              label={t("messagesModule.contactPartner")}
              ariaLabel={t("messagesModule.contactPartner")}
            />
            <Button asChild variant="outline">
              <Link href={`/marketplace/produtos?partnerId=${partner.id}`}>
                <Package className="mr-1 h-4 w-4" />
                {t("marketplace.viewProducts")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/marketplace/servicos?partnerId=${partner.id}`}>
                <Scissors className="mr-1 h-4 w-4" />
                {t("marketplace.viewServices")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {partner.products.length > 0 && (
        <section aria-labelledby="partner-products-heading">
          <h2 id="partner-products-heading" className="mb-3 text-lg font-semibold">{t("nav.products")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {partner.products.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/marketplace/produto/${p.id}`} className="rounded-xl border p-4 hover:border-ecopet-green">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-ecopet-green">R$ {p.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {partner.services.length > 0 && (
        <section aria-labelledby="partner-services-heading">
          <h2 id="partner-services-heading" className="mb-3 text-lg font-semibold">{t("nav.services")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {partner.services.slice(0, 6).map((s) => (
              <Link key={s.id} href={`/marketplace/servico/${s.id}`} className="rounded-xl border p-4 hover:border-ecopet-green">
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-ecopet-green">R$ {s.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {partner.reviews.length > 0 && (
        <section aria-labelledby="partner-reviews-heading">
          <h2 id="partner-reviews-heading" className="mb-3 text-lg font-semibold">{t("marketplace.reviews")}</h2>
          <div className="space-y-3">
            {partner.reviews.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-sm">
                  <p className="font-medium">{r.user.name} — {r.rating}/5</p>
                  {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

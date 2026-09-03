import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";

export default function AssinaturaPage() {
  return (
    <>
      <AppHeader title="Planos EccoPet One" />
      <main className="mx-auto max-w-6xl flex-1 space-y-10 p-4 lg:p-8">
        <CatalogOfferGrid
          family="ONE"
          title="Planos para tutores"
          subtitle="Preços oficiais BR-2026.08-v1. Assinatura, renovação, cancelamento e histórico no painel do cliente."
        />
        <CatalogOfferGrid
          family="AI_ADDON"
          skus={[
            "AI-T01", "AI-T02", "AI-T03", "AI-T04", "AI-T05", "AI-T06", "AI-T07",
            "AI-T08", "AI-T09", "AI-T10", "AI-T11", "AI-T12", "AI-T13", "AI-T14",
          ]}
          title="Módulos de IA para tutores"
          subtitle="Add-ons PFO (AI-T*). Separados da loja dos 13 especialistas EccoPet AI."
        />
      </main>
    </>
  );
}

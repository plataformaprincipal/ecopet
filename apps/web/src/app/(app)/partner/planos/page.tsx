import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";

export default function PartnerPlanosPage() {
  return (
    <>
      <AppHeader title="Planos Pro" />
      <main className="mx-auto max-w-6xl flex-1 space-y-10 p-4 lg:p-8">
        <CatalogOfferGrid
          family="PRO"
          title="Planos parceiro"
          subtitle="PRO-001 a PRO-015 conforme PFO. Upgrade, faturas e cancelamento no mesmo fluxo Mercado Pago."
          partner
        />
        <CatalogOfferGrid family="ADS" title="EccoPet Ads" subtitle="Fee EccoPet ≠ orçamento de mídia. Mídia pass-through permanece CATALOG_ONLY." partner />
        <CatalogOfferGrid
          family="AI_ADDON"
          skus={[
            "AI-P01", "AI-P02", "AI-P03", "AI-P04", "AI-P05", "AI-P06", "AI-P07",
            "AI-P08", "AI-P09", "AI-P10", "AI-P11", "AI-P12", "AI-P13", "AI-P14",
            "AI-C01", "AI-C02", "AI-C03", "AI-C04", "AI-C05",
          ]}
          title="Módulos de IA para parceiro/clínica"
          subtitle="AI-P* e AI-C* separados da loja dos 13 especialistas. AI-C05 exige radiologista habilitado."
          partner
        />
      </main>
    </>
  );
}

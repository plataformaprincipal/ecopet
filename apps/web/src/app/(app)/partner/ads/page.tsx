import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";

export default function PartnerAdsPage() {
  return (
    <>
      <AppHeader title="EccoPet Ads" />
      <main className="mx-auto max-w-6xl flex-1 p-4 lg:p-8">
        <CatalogOfferGrid
          family="ADS"
          title="Visibilidade e tráfego"
          subtitle="Fee EccoPet separado do orçamento de mídia. Campanhas com mídia mínima ficam CATALOG_ONLY até setup real."
          partner
        />
      </main>
    </>
  );
}

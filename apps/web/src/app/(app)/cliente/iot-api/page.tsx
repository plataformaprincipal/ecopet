import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";

export default function ClienteIotApiPage() {
  return (
    <>
      <AppHeader title="IoT e API" />
      <main className="mx-auto max-w-6xl flex-1 space-y-10 p-4 lg:p-8">
        <CatalogOfferGrid family="IOT" title="IoT e dispositivos" subtitle="Hardware afiliado: EccoPet reconhece só a comissão. PARTNER_REQUIRED até parceiro." />
        <CatalogOfferGrid family="API" title="APIs" subtitle="Starter, Growth, Enterprise e implantação conforme PFO. CATALOG_ONLY até a plataforma de dados estar habilitada." />
      </main>
    </>
  );
}

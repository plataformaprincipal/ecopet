import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";
import { ProtectionWorkspace } from "@/components/features/commerce/protection-workspace";

export const metadata = { title: "Seguro e proteção pet | EccoPet" };

export default function SeguroPage() {
  return (
    <>
      <AppHeader title="Seguro e proteção" />
      <main className="mx-auto max-w-6xl flex-1 space-y-6 p-4 lg:p-8">
        <CatalogOfferGrid
          family="PROTECT"
          skus={["PRT-001", "PRT-002", "PRT-003", "PRT-004", "PRT-005", "PRT-006", "PRT-007", "PRT-008", "PRT-009", "PRT-010"]}
          title="Proteção pet"
          subtitle="A EccoPet é intermediadora. Prêmio não vira receita integral. Cobertura só com seguradora/corretora autorizada."
        />
        <ProtectionWorkspace />
      </main>
    </>
  );
}

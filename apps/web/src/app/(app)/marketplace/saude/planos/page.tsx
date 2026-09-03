import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";
import { HealthPlanComparison } from "@/components/features/commerce/health-plan-comparison";
import { ProtectionWorkspace } from "@/components/features/commerce/protection-workspace";

export const metadata = { title: "Planos de saúde pet | EccoPet" };

export default function PlanosSaudePage() {
  return (
    <>
      <AppHeader title="Planos de saúde pet" />
      <main className="mx-auto max-w-6xl flex-1 space-y-6 p-4 lg:p-8">
        <HealthPlanComparison />
        <CatalogOfferGrid
          family="HEALTH_PLAN"
          skus={["PRT-001", "PRT-002", "PRT-003"]}
          title="EccoPet Saúde"
          subtitle="SKUs PRT oficiais. A EccoPet não oferece cobertura própria. PARTNER_REQUIRED até operador autorizado."
        />
        <ProtectionWorkspace />
      </main>
    </>
  );
}

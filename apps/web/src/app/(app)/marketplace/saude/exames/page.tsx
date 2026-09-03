import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";
import { HealthCaseWorkspace } from "@/components/features/commerce/health-case-workspace";

export const metadata = { title: "Exames e resultados | EccoPet" };

export default function ExamesPage() {
  return (
    <>
      <AppHeader title="Diagnósticos e resultados" />
      <main className="mx-auto max-w-6xl flex-1 space-y-6 p-4 lg:p-8">
        <p className="text-sm text-muted-foreground">
          Envie exames, receba pré-análise assistida e, quando exigido, validação de profissional habilitado. Não vendemos diagnóstico automático por IA.
        </p>
        <CatalogOfferGrid
          family="EXAMS"
          skus={["SAU-009", "SAU-010", "SAU-017", "SAU-018", "SAU-022", "SAU-023", "SAU-029", "SAU-030"]}
          title="Exames, interpretação e segunda opinião"
          subtitle="Preços SAU do PFO. Resultado final no Health Profile após pagamento e, se necessário, revisão humana."
        />
        <HealthCaseWorkspace skuDefault="SAU-009" />
      </main>
    </>
  );
}

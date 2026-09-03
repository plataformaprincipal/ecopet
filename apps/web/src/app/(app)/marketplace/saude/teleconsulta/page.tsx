import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";
import { HealthCaseWorkspace } from "@/components/features/commerce/health-case-workspace";

export const metadata = { title: "Teleconsulta e laudos | EccoPet" };

export default function TeleconsultaPage() {
  return (
    <>
      <AppHeader title="Teleconsulta + laudos" />
      <main className="mx-auto max-w-6xl flex-1 space-y-6 p-4 lg:p-8">
        <p className="text-sm text-muted-foreground">
          Selecione o pet, pague via Mercado Pago e acompanhe o caso. Laudo/atestado final identifica CRMV e trilha de auditoria.
          OpenAI só organiza dados e rascunhos — nunca documento profissional definitivo.
        </p>
        <CatalogOfferGrid
          family="TELEHEALTH"
          skus={["SAU-006", "SAU-007", "SAU-008", "SAU-010", "SAU-011", "SAU-012"]}
          title="Teleatendimento"
          subtitle="SAU-008 só fica PURCHASABLE com veterinário habilitado. Até lá: PARTNER_REQUIRED."
        />
        <HealthCaseWorkspace skuDefault="SAU-008" />
      </main>
    </>
  );
}

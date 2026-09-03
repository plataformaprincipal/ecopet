import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";
import { EntertainmentWaitlist } from "@/components/features/commerce/entertainment-waitlist";
import Link from "next/link";

export const metadata = { title: "Plano de Entretenimento Pet | EccoPet" };

export default function EntretenimentoPage() {
  return (
    <>
      <AppHeader title="Entretenimento pet" />
      <main className="mx-auto max-w-6xl flex-1 space-y-6 p-4 lg:p-8">
        <p className="text-sm text-muted-foreground">
          Não há SKU/preço oficial de entretenimento no PFO. Infraestrutura criada com status PRICE_PENDING e billing_enabled=false. Preço não foi inventado.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="rounded-full border px-4 py-2" href="/cliente/gamificacao">
            Gamificação
          </Link>
          <Link className="rounded-full border px-4 py-2" href="/cliente/rewards">
            Rewards
          </Link>
          <Link className="rounded-full border px-4 py-2" href="/cliente/explorar">
            Experiências
          </Link>
        </div>
        <EntertainmentWaitlist />
        <CatalogOfferGrid
          family="ENTERTAINMENT"
          title="Plano de Entretenimento"
          subtitle="DRAFT / PRICE_PENDING. Contratação bloqueada até preço oficial."
        />
      </main>
    </>
  );
}

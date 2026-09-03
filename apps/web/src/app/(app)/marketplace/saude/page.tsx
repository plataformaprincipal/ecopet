import { AppHeader } from "@/components/layouts/app-header";
import { CatalogOfferGrid } from "@/components/features/commerce/catalog-offer-grid";
import { HEALTH_MARKETPLACE_GROUPS } from "@/lib/commerce-catalog/products";
import Link from "next/link";

export const metadata = {
  title: "Marketplace Saúde | EccoPet",
  description: "Consultas, teleatendimento, exames, laudos, especialidades e emergência — catálogo PFO.",
};

export default function MarketplaceSaudeHubPage() {
  return (
    <>
      <AppHeader title="Marketplace Saúde" />
      <main className="mx-auto max-w-6xl flex-1 space-y-8 p-4 lg:p-8">
        <p className="text-sm text-muted-foreground">
          Diagnóstico, laudo, prescrição e atestado definitivos exigem veterinário habilitado. A IA apenas organiza e rascunha.
        </p>
        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/marketplace/saude/planos", label: "Planos de saúde" },
            { href: "/marketplace/saude/teleconsulta", label: "Teleconsulta e laudos" },
            { href: "/marketplace/saude/exames", label: "Exames e resultados" },
            { href: "/marketplace/seguro", label: "Seguro e proteção" },
            { href: "/cliente/saude", label: "Meus casos" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl border p-4 text-sm font-medium hover:bg-muted">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          {HEALTH_MARKETPLACE_GROUPS.map((g) => (
            <Link key={g.id} href={`/marketplace/saude/exames?group=${g.id}`} className="rounded-full border px-4 py-2 text-sm">
              {g.label}
            </Link>
          ))}
        </div>
        <CatalogOfferGrid
          family="HEALTH_DIGITAL"
          title="Serviços digitais de saúde"
          subtitle="SKUs SAU oficiais. Itens com ato veterinário ficam PARTNER_REQUIRED até haver profissional habilitado."
        />
      </main>
    </>
  );
}

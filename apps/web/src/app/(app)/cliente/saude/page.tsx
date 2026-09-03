import { HealthCaseWorkspace } from "@/components/features/commerce/health-case-workspace";
import { AppHeader } from "@/components/layouts/app-header";
import Link from "next/link";

export const metadata = { title: "Meus casos de saúde | EccoPet" };

export default function ClienteSaudePage() {
  return (
    <>
      <AppHeader title="Saúde do pet" />
      <main className="mx-auto max-w-6xl flex-1 space-y-4 p-4 lg:p-8">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/marketplace/saude/teleconsulta">Teleconsulta</Link>
          <Link href="/marketplace/saude/exames">Exames</Link>
          <Link href="/marketplace/saude/planos">Planos</Link>
          <Link href="/cliente/assinaturas">Assinaturas</Link>
        </div>
        <HealthCaseWorkspace />
      </main>
    </>
  );
}

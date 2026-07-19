import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { FinanceiroPanel } from "@/components/features/marketplace/financeiro-panel";

export default async function PartnerFinanceiroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/partner/financeiro");
  if (user.role !== UserRole.PARTNER) redirect("/");
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Financeiro do parceiro</h1>
      <p className="text-sm text-muted-foreground">
        Apenas pedidos e eventos do seu estabelecimento. Split automático não está ativo.
      </p>
      <FinanceiroPanel role="partner" />
    </main>
  );
}

import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { FinanceiroPanel } from "@/components/features/marketplace/financeiro-panel";

export default async function ClienteFinanceiroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/financeiro");
  if (user.role !== UserRole.CLIENT) redirect("/");
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Central financeira</h1>
      <p className="text-sm text-muted-foreground">
        Pedidos, pagamentos, reclamações e contestações. Dados de cartão e critérios de fraude não
        são exibidos.
      </p>
      <FinanceiroPanel role="client" />
    </main>
  );
}

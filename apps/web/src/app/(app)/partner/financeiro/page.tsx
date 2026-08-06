import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { FinanceiroPanel } from "@/components/features/marketplace/financeiro-panel";
import { getPartnerBalances } from "@/lib/finance/balances";
import { prisma } from "@/lib/prisma";

export default async function PartnerFinanceiroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/partner/financeiro");
  if (user.role !== UserRole.PARTNER) redirect("/");

  const balances = await getPartnerBalances(user.id);
  const recentPayouts = await prisma.partnerPayout.findMany({
    where: { partnerId: user.id },
    orderBy: { requestedAt: "desc" },
    take: 10,
  });

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Financeiro do parceiro</h1>
      <p className="text-sm text-muted-foreground">
        Split lógico interno. Valor estimado não é disponível; disponível não é repasse concluído.
      </p>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div>
          <p className="text-muted-foreground">Pendente</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.pending.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Bloqueado</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.blocked.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Disponível</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.available.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Em processamento</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.inPayout.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pago (sandbox)</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.paid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Débitos / negativo</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.negative.toFixed(2)}</p>
        </div>
      </section>
      {recentPayouts.length > 0 && (
        <section className="space-y-2 text-sm">
          <h2 className="font-medium">Histórico de repasses</h2>
          <ul className="space-y-1">
            {recentPayouts.map((p) => (
              <li key={p.id}>
                {(p.amountCents / 100).toFixed(2)} — {p.status} —{" "}
                {p.requestedAt.toISOString().slice(0, 10)}
              </li>
            ))}
          </ul>
        </section>
      )}
      <FinanceiroPanel role="partner" />
    </main>
  );
}

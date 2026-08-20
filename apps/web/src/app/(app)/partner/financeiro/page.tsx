import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { FinanceiroPanel } from "@/components/features/marketplace/financeiro-panel";
import { getPartnerBalances } from "@/lib/finance/balances";
import { prisma } from "@/lib/prisma";
import { getPartnerMpConnectionView } from "@/lib/mercado-pago/partner-oauth";
import { PartnerMpConnectButton } from "@/components/features/partner/partner-mp-connect-button";

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
  const paidAgg = await prisma.order.aggregate({
    where: {
      partnerId: user.id,
      status: { in: ["PAID", "COMPLETED", "DELIVERED", "SHIPPED", "CONFIRMED"] },
    },
    _sum: {
      grossAmount: true,
      platformFeeAmount: true,
      partnerAmount: true,
      reserveAmount: true,
      discount: true,
    },
  });
  const [refundAgg, chargebackAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: { partnerId: user.id, refundedAmount: { gt: 0 } },
      _sum: { refundedAmount: true },
    }),
    prisma.financialChargeback.aggregate({
      where: { partnerId: user.id, status: { in: ["OPEN", "UNDER_REVIEW", "LOST"] } },
      _sum: { amountCents: true },
    }),
  ]);
  const gmv = paidAgg._sum.grossAmount ?? 0;
  const platformRevenue = paidAgg._sum.platformFeeAmount ?? 0;
  const partnerEconomic = paidAgg._sum.partnerAmount ?? 0;
  const reserve = paidAgg._sum.reserveAmount ?? 0;
  const mpConnection = await getPartnerMpConnectionView(user.id);

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Financeiro do parceiro</h1>
      <p className="text-sm text-muted-foreground">
        Split lógico interno. GMV não é lucro. Valor estimado não é disponível; disponível não é
        repasse concluído. Split Mercado Pago automático não está ativo. Reserva de 1,5% é
        planejamento — não é hold do PSP.
      </p>
      <section className="rounded-2xl border p-4 text-sm" data-testid="partner-mp-connection">
        <h2 className="font-medium">Mercado Pago do vendedor</h2>
        <p className="mt-1 text-muted-foreground">
          Status: <strong>{mpConnection.status}</strong>
          {mpConnection.mpUserId ? ` · conta ${mpConnection.mpUserId}` : ""}
        </p>
        {mpConnection.lastError ? (
          <p className="mt-1 text-muted-foreground">{mpConnection.lastError}</p>
        ) : null}
        {mpConnection.status !== "CONNECTED" ? (
          <div className="mt-3">
            <PartnerMpConnectButton oauthConfigured={mpConnection.oauthConfigured} />
          </div>
        ) : null}
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm" data-testid="partner-finance-snapshots">
        <div>
          <p className="text-muted-foreground">GMV (volume)</p>
          <p className="text-lg font-medium">R$ {gmv.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Comissão EccoPet</p>
          <p className="text-lg font-medium">R$ {platformRevenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Valor do parceiro</p>
          <p className="text-lg font-medium">R$ {partnerEconomic.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Reserva (planejamento)</p>
          <p className="text-lg font-medium">R$ {reserve.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Estornos</p>
          <p className="text-lg font-medium">R$ {(refundAgg._sum.refundedAmount ?? 0).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Chargebacks abertos</p>
          <p className="text-lg font-medium">
            R$ {((chargebackAgg._sum.amountCents ?? 0) / 100).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Payout elegível (ledger)</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.available.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Payout pago (sandbox)</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.paid.toFixed(2)}</p>
        </div>
      </section>
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

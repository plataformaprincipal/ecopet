import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPartnerBalances } from "@/lib/finance/balances";
import { getPartnerMpConnectionView } from "@/lib/mercado-pago/partner-oauth";
import { PartnerMpConnectButton } from "@/components/features/partner/partner-mp-connect-button";
import { OngOnboardingChecklist } from "@/components/features/ong/ong-onboarding-checklist";
import { evaluateOngOnboarding } from "@/lib/ong/onboarding";
import { maskFinancialDetails } from "@/lib/partner/onboarding";

export default async function NgoFinanceiroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ngo/financeiro");
  if (user.role !== UserRole.ONG) redirect("/");

  const [profile, mp, balances, donationsAgg, adoptionsCount] = await Promise.all([
    prisma.ongProfile.findUnique({ where: { userId: user.id } }),
    getPartnerMpConnectionView(user.id),
    getPartnerBalances(user.id),
    prisma.order.aggregate({
      where: {
        partnerId: user.id,
        status: { in: ["PAID", "COMPLETED", "DELIVERED", "SHIPPED", "CONFIRMED"] },
      },
      _sum: { partnerAmount: true, grossAmount: true },
    }),
    prisma.adoptionRequest.count({
      where: { ongId: user.id, status: { in: ["APPROVED", "COMPLETED"] } },
    }),
  ]);
  const details = (profile?.profileDetails ?? {}) as Record<string, unknown>;
  const snapshot = evaluateOngOnboarding({
    accountStatus: user.accountStatus,
    verificationStatus: profile?.verificationStatus,
    approvedAt: profile?.approvedAt,
    name: profile?.name,
    ongName: profile?.ongName,
    address: profile?.address,
    city: profile?.city,
    description: profile?.description,
    focusArea: profile?.focusArea,
    documents: profile?.documents,
    profileDetails: profile?.profileDetails,
    financialDetails: details.financialDetails,
    mpStatus: mp.status,
    mpUserId: mp.mpUserId,
  });
  const bank = maskFinancialDetails(details.financialDetails);

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Financeiro da ONG</h1>
      <p className="text-sm text-muted-foreground">
        Mensalidade EccoPet R$ 0,00 · taxa de adoção/doação R$ 0,00 · {snapshot.adsCreditsRemaining} anúncios
        gratuitos restantes de {snapshot.adsCreditsPerYear} por ano.
      </p>
      {!snapshot.sellable ? <OngOnboardingChecklist snapshot={snapshot} /> : null}

      <section className="rounded-2xl border p-4 text-sm" data-testid="ong-mp-connection">
        <h2 className="font-medium">Conta de pagamento</h2>
        <p className="mt-1 text-muted-foreground">
          Verificação: <strong>{snapshot.status}</strong> · Mercado Pago: <strong>{mp.status}</strong>
          {mp.mpUserId ? ` · conta ${mp.mpUserId}` : ""}
        </p>
        <div className="mt-3">
          <PartnerMpConnectButton
            oauthConfigured={mp.oauthConfigured}
            endpoint="/api/ong/mp-connection"
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="text-muted-foreground">Valores recebidos</p>
          <p className="text-lg font-medium">R$ {(donationsAgg._sum.partnerAmount ?? 0).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Adoções concluídas</p>
          <p className="text-lg font-medium">{adoptionsCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ads gratuitos usados</p>
          <p className="text-lg font-medium">
            {snapshot.adsCreditsUsed}/{snapshot.adsCreditsPerYear}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Saldo Ads restante</p>
          <p className="text-lg font-medium">{snapshot.adsCreditsRemaining}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Saldo pendente</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.pending.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Saldo liberado</p>
          <p className="text-lg font-medium">R$ {balances.asFloats.available.toFixed(2)}</p>
        </div>
      </section>

      <section className="rounded-2xl border p-4 text-sm" data-testid="ong-bank-masked">
        <h2 className="font-medium">Dados bancários</h2>
        <p className="mt-2 text-muted-foreground">
          Banco {bank.bankName ?? "—"} · agência {bank.agency ?? "—"} · conta {bank.accountNumber ?? "—"} · Pix{" "}
          {bank.pixKey ?? "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Documentos: {snapshot.checklist.documents ? "enviados" : "pendentes"}</p>
      </section>
    </main>
  );
}

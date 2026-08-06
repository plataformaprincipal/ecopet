import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildFinancialReport } from "@/lib/finance/reporting";

export default async function AdminFinanceLedgerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/financeiro/ledger");
  if (user.role !== UserRole.ADMIN) redirect("/unauthorized");

  const [entries, payouts, chargebacks, recon, report] = await Promise.all([
    prisma.financialLedgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.partnerPayout.findMany({ orderBy: { requestedAt: "desc" }, take: 20 }),
    prisma.financialChargeback.findMany({ orderBy: { openedAt: "desc" }, take: 20 }),
    prisma.financialReconciliation.findMany({
      where: { status: { not: "RECONCILED" } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    buildFinancialReport(),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Financeiro — Ledger</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/financeiro">Voltar</Link>
          <Link href="/api/admin/financeiro/export?type=ledger">Exportar ledger CSV</Link>
        </div>
      </div>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="text-muted-foreground">GMV</p>
          <p className="font-medium">R$ {report.gmv.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Receita bruta EccoPet</p>
          <p className="font-medium">R$ {report.receitaBrutaEccopet.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Parceiros (payable)</p>
          <p className="font-medium">R$ {report.valoresParceiros.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Divergências</p>
          <p className="font-medium">{report.divergencias}</p>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">{report.notes.gmvIsNotRevenue}</p>

      <section className="space-y-2">
        <h2 className="font-medium">Lançamentos recentes</h2>
        <ul className="space-y-1 text-sm">
          {entries.map((e) => (
            <li key={e.id}>
              {e.entryType} {e.direction} {(e.amountCents / 100).toFixed(2)} — {e.status}
              {e.partnerId ? ` — partner ${e.partnerId.slice(0, 8)}` : ""}
            </li>
          ))}
          {entries.length === 0 && <li>Nenhum lançamento.</li>}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Repasses</h2>
        <ul className="space-y-1 text-sm">
          {payouts.map((p) => (
            <li key={p.id}>
              {(p.amountCents / 100).toFixed(2)} — {p.status} — {p.partnerId.slice(0, 8)}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Chargebacks</h2>
        <ul className="space-y-1 text-sm">
          {chargebacks.map((c) => (
            <li key={c.id}>
              {(c.amountCents / 100).toFixed(2)} — {c.status} — order {c.orderId.slice(0, 8)}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Divergências de conciliação</h2>
        <ul className="space-y-1 text-sm">
          {recon.map((r) => (
            <li key={r.id}>
              {r.status} — payment {r.paymentId?.slice(0, 8) ?? "—"}
            </li>
          ))}
          {recon.length === 0 && <li>Nenhuma divergência aberta.</li>}
        </ul>
      </section>
    </main>
  );
}

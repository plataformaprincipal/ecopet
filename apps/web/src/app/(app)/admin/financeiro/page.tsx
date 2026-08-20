import Link from "next/link";
import { AdminModulePage } from "@/components/features/admin/admin-module-page";

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <div className="px-6 pt-4 text-sm">
        <Link href="/admin/financeiro/ledger" className="underline">
          Ledger, saldos, repasses, chargebacks e conciliação
        </Link>
        {" · "}
        <Link href="/admin/financeiro/conciliacao" className="underline">
          Conciliação
        </Link>
        {" · "}
        <Link href="/api/admin/financeiro/alerts" className="underline">
          Alertas financeiros
        </Link>
        {" · "}
        <Link href="/api/admin/financeiro/export?type=ledger" className="underline">
          Exportar CSV
        </Link>
      </div>
      <AdminModulePage moduleId="financeiro" />
    </div>
  );
}

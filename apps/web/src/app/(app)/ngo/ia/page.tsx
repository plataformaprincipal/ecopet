import { Suspense } from "react";
import { NgoIaErpPage } from "@/components/features/ong/erp/ngo-ia-erp-page";

/** ERP operacional da ONG — não substitui o módulo EccoPet AI em /ngo/eccopet. */
export default function NgoIaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[var(--ep-fg-muted)]">Carregando IA…</p>}>
      <NgoIaErpPage />
    </Suspense>
  );
}

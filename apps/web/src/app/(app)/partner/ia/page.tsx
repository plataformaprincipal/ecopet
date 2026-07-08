import { Suspense } from "react";
import { PartnerIaErpPage } from "@/components/features/partner/erp/partner-ia-erp-page";

export default function PartnerIaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando IA…</p>}>
      <PartnerIaErpPage />
    </Suspense>
  );
}

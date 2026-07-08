import { NgoAdoptionRequestsList } from "@/components/features/ong/experience/ngo-adoption-requests-list";
import { NgoErpModulePanel } from "@/components/features/ong/erp/ngo-erp-module-panel";
import { NGO_ERP_MODULE_CONFIG } from "@/lib/ong/erp/module-config";

export default function NgoAdocoesPage() {
  return (
    <div className="space-y-6">
      <NgoErpModulePanel config={NGO_ERP_MODULE_CONFIG.adocoes} />
      <NgoAdoptionRequestsList />
    </div>
  );
}

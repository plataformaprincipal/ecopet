import { OngAdoptionsPage } from "@/components/features/ong/pages/ong-adoptions-page";
import { NgoErpModulePanel } from "@/components/features/ong/erp/ngo-erp-module-panel";
import { NGO_ERP_MODULE_CONFIG } from "@/lib/ong/erp/module-config";

export default function NgoAnimaisPage() {
  return (
    <div className="space-y-6">
      <NgoErpModulePanel config={NGO_ERP_MODULE_CONFIG.animais} />
      <OngAdoptionsPage accessLevel="full" />
    </div>
  );
}

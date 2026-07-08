import { PartnerErpModulePanel } from "@/components/features/partner/erp/partner-erp-module-panel";
import { PARTNER_ERP_MODULE_CONFIG } from "@/lib/partner/erp/module-config";
import type { PartnerErpModuleId } from "@/lib/partner/erp/types";

type Props = { moduleId: PartnerErpModuleId };

export function PartnerErpPage({ moduleId }: Props) {
  const config = PARTNER_ERP_MODULE_CONFIG[moduleId];
  return <PartnerErpModulePanel config={config} />;
}

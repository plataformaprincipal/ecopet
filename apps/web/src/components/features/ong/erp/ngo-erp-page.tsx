import { NgoErpModulePanel } from "./ngo-erp-module-panel";
import { NGO_ERP_MODULE_CONFIG } from "@/lib/ong/erp/module-config";
import type { NgoErpModuleId } from "@/lib/ong/erp/types";

type Props = { moduleId: NgoErpModuleId };

export function NgoErpPage({ moduleId }: Props) {
  const config = NGO_ERP_MODULE_CONFIG[moduleId];
  return <NgoErpModulePanel config={config} />;
}

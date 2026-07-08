import type { NgoErpModuleId } from "./types";
import { NGO_ERP_MODULES } from "./types";

export type NgoErpModuleConfig = {
  id: NgoErpModuleId;
  title: string;
  description: string;
};

export const NGO_ERP_MODULE_CONFIG: Record<NgoErpModuleId, NgoErpModuleConfig> = Object.fromEntries(
  (Object.keys(NGO_ERP_MODULES) as NgoErpModuleId[]).map((id) => [
    id,
    { id, title: NGO_ERP_MODULES[id].title, description: NGO_ERP_MODULES[id].description },
  ])
) as Record<NgoErpModuleId, NgoErpModuleConfig>;

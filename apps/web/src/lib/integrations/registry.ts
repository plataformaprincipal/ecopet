/**

 * Registro central de integrações externas.

 * Status real via definitions.ts + health.ts — nunca marcar ACTIVE sem credencial.

 */



import type { PlatformIntegrationCategory } from "@/lib/integrations/types";

import { INTEGRATION_DEFINITIONS } from "@/lib/integrations/definitions";



export type IntegrationKind = PlatformIntegrationCategory;



export type IntegrationProvider = {

  id: string;

  kind: IntegrationKind;

  enabled: boolean;

  configure?(env: NodeJS.ProcessEnv): void;

};



const providers = new Map<string, IntegrationProvider>();



export function registerIntegration(provider: IntegrationProvider) {

  providers.set(`${provider.kind}:${provider.id}`, provider);

}



export function getIntegration(kind: IntegrationKind, id: string) {

  return providers.get(`${kind}:${id}`);

}



export function listIntegrations(kind?: IntegrationKind) {

  return [...providers.values()].filter((p) => !kind || p.kind === kind);

}



export function isIntegrationEnabled(kind: IntegrationKind, id: string) {

  return getIntegration(kind, id)?.enabled ?? false;

}



/** Bootstrap: registra definições conhecidas (status real vem de health.ts) */

export function bootstrapIntegrationRegistry() {

  for (const def of INTEGRATION_DEFINITIONS) {

    const enabled = def.resolveStatus() === "ACTIVE";

    registerIntegration({ id: def.name, kind: def.category, enabled });

  }

}



bootstrapIntegrationRegistry();



export { INTEGRATION_DEFINITIONS } from "@/lib/integrations/definitions";

export { getIntegrationHealthReport, buildIntegrationHealth } from "@/lib/integrations/health";

export { writeIntegrationLog } from "@/lib/integrations/log";

export { INTEGRATION_ERROR_CODES, IntegrationNotConfiguredError } from "@/lib/integrations/errors";



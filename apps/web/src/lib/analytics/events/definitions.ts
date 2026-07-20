import { isSafeEventName } from "../sanitize";

/** Definição tipada de evento EcoPet → GA4. */
export type AnalyticsEventDefinition = {
  /** Nome GA4 (snake_case, ≤40). */
  event_name: string;
  category: string;
  action: string;
  module: string;
  /** Descrição interna (nunca enviada ao GA). */
  description?: string;
};

export function defineEvent(def: AnalyticsEventDefinition): AnalyticsEventDefinition {
  if (!isSafeEventName(def.event_name)) {
    throw new Error(`[ecopet-analytics] invalid event_name: ${def.event_name}`);
  }
  return Object.freeze(def);
}

export type EventModuleCatalog = Record<string, AnalyticsEventDefinition>;

export function catalogValues(catalog: EventModuleCatalog): AnalyticsEventDefinition[] {
  return Object.values(catalog);
}

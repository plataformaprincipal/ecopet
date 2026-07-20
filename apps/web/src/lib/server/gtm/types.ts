export type GtmOpsConfigFlags = {
  /** Coleta operacional habilitada (não remove env GTM_ID). */
  collectionEnabled?: boolean;
  debugEnabled?: boolean;
  consentRequired?: boolean;
  eventContractVersion?: number;
  diagnosticLevel?: "basic" | "full";
  /** Permitir POST test em production. */
  allowProductionTest?: boolean;
};

export const GTM_CONTRACT_VERSION = 1;

export const TRANSACTIONAL_EVENTS = [
  "purchase",
  "refund",
  "order_refund",
  "donation_completed",
  "adoption_completed",
  "partner_approved",
  "ngo_approved",
  "order_cancel",
  "service_complete",
] as const;

export type TransactionalEventName = (typeof TRANSACTIONAL_EVENTS)[number];

export function isTransactionalEventName(name: string): name is TransactionalEventName {
  return (TRANSACTIONAL_EVENTS as readonly string[]).includes(name);
}

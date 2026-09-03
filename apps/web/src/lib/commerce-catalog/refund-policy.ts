/** Políticas de reembolso por família — base PFO. Override por SKU no banco. */

export type RefundPolicy = {
  skuPattern: string;
  beforeAcceptRefund: boolean;
  afterStartPolicy: string;
  noShowProviderMaxBps: number;
  payoutDays: number;
};

export const DEFAULT_REFUND_POLICIES: RefundPolicy[] = [
  { skuPattern: "MKT-", beforeAcceptRefund: true, afterStartPolicy: "SKU_SPECIFIC", noShowProviderMaxBps: 0, payoutDays: 14 },
  { skuPattern: "SRV-", beforeAcceptRefund: true, afterStartPolicy: "SKU_SPECIFIC", noShowProviderMaxBps: 5000, payoutDays: 7 },
  { skuPattern: "SAU-", beforeAcceptRefund: true, afterStartPolicy: "SKU_SPECIFIC", noShowProviderMaxBps: 5000, payoutDays: 7 },
  { skuPattern: "ONE-", beforeAcceptRefund: true, afterStartPolicy: "PERIOD_END", noShowProviderMaxBps: 0, payoutDays: 0 },
  { skuPattern: "PRO-", beforeAcceptRefund: true, afterStartPolicy: "PERIOD_END", noShowProviderMaxBps: 0, payoutDays: 0 },
  { skuPattern: "PRT-", beforeAcceptRefund: true, afterStartPolicy: "OPERATOR_RULE", noShowProviderMaxBps: 0, payoutDays: 0 },
  { skuPattern: "ADS-", beforeAcceptRefund: true, afterStartPolicy: "PRORATA_UNUSED", noShowProviderMaxBps: 0, payoutDays: 0 },
];

export function refundPolicyForSku(sku: string): RefundPolicy {
  return DEFAULT_REFUND_POLICIES.find((p) => sku.startsWith(p.skuPattern)) ?? DEFAULT_REFUND_POLICIES[3]!;
}

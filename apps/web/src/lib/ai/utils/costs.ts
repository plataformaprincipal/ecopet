import type { AiTokenUsageRecord } from "@/lib/ai/types";

/** Estrutura de controle de custos — persistida em AITokenUsage. */
export type AiCostRecord = AiTokenUsageRecord & {
  usageDate: string;
};

export function summarizeCosts(records: AiCostRecord[]) {
  return records.reduce(
    (acc, r) => ({
      tokensInput: acc.tokensInput + r.tokensInput,
      tokensOutput: acc.tokensOutput + r.tokensOutput,
      estimatedCost: acc.estimatedCost + r.estimatedCost,
    }),
    { tokensInput: 0, tokensOutput: 0, estimatedCost: 0 }
  );
}

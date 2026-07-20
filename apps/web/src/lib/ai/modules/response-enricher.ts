import type { ToolExecutionResult } from "./types";
import { truncateToTokenBudget } from "./token-manager";

/** Formata resultados de ferramentas como bloco de contexto para o modelo. */
export function enrichPromptWithToolResults(results: ToolExecutionResult[]): string {
  const ok = results.filter((r) => r.ok && r.executed);
  if (!ok.length) return "";

  const parts = ok.map((r) => {
    const payload = JSON.stringify(r.data, null, 0);
    return `### Ferramenta ${r.toolName}\n\`\`\`json\n${truncateToTokenBudget(payload, 800)}\n\`\`\``;
  });

  return [
    "## Dados reais obtidos via ferramentas internas (somente leitura)",
    "Baseie-se nestes dados. Se estiverem vazios, diga que não há registros.",
    ...parts,
  ].join("\n\n");
}

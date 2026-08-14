import type { ToolExecutionResult } from "./types";
import { truncateToTokenBudget } from "./token-manager";

/** Formata resultados de ferramentas como bloco de contexto para o modelo. */
export function enrichPromptWithToolResults(results: ToolExecutionResult[]): string {
  const executed = results.filter((r) => r.ok && r.executed);
  const pending = results.filter((r) => r.ok && !r.executed && r.requiresConfirmation);
  if (!executed.length && !pending.length) return "";

  const format = (r: ToolExecutionResult, heading: string) => {
    const payload = JSON.stringify(r.data, null, 0);
    return `### ${heading} ${r.toolName}\n\`\`\`json\n${truncateToTokenBudget(payload, 800)}\n\`\`\``;
  };

  const blocks: string[] = [];

  if (executed.length) {
    blocks.push(
      "## Dados reais obtidos via ferramentas internas (somente leitura)",
      "Baseie-se nestes dados. Se estiverem vazios, diga que não há registros.",
      ...executed.map((r) => format(r, "Ferramenta"))
    );
  }

  if (pending.length) {
    blocks.push(
      "## Ações aguardando confirmação (nada foi executado ainda)",
      "Descreva a prévia ao usuário e peça confirmação explícita antes de executar. Nunca afirme que a ação já foi concluída.",
      ...pending.map((r) => format(r, "Prévia de"))
    );
  }

  return blocks.join("\n\n");
}

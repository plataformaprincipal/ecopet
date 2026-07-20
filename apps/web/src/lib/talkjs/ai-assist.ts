/**
 * Assistência IA para mensagens — apenas rascunhos; nunca envia sozinha.
 */
import "server-only";

import { isMessagingFlagEnabled } from "./config";
import { isAiFlagEnabled } from "@/lib/ai/operational/feature-flags";
import { runPromptFirewall } from "@/lib/ai/enterprise/prompt-firewall";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";

export async function suggestMessageReplyDraft(input: {
  userId: string;
  role: string;
  lastMessages: string[];
  locale?: string;
}): Promise<{ draft: string; disclaimer: string } | null> {
  if (!isMessagingFlagEnabled("ai_assist") || !isAiFlagEnabled("assistant")) {
    return null;
  }

  const joined = input.lastMessages
    .slice(-6)
    .map((m) => m.slice(0, 400))
    .join("\n");

  const firewall = runPromptFirewall(joined, { userId: input.userId });
  if (firewall.decision === "BLOCK") {
    await writeAiAuditLog({
      userId: input.userId,
      role: input.role,
      module: "messages",
      action: "suggest-reply-blocked",
      decision: "DENY",
    });
    return null;
  }

  // Rascunho heurístico seguro sem chamar OpenAI se não necessário —
  // evita custo; UI pode pedir geração completa via assistente.
  const draft = [
    "Olá! Obrigado pela mensagem.",
    "Vou verificar os detalhes e retorno em breve com as informações corretas.",
    "(Rascunho gerado pela EcoPet IA — revise antes de enviar.)",
  ].join(" ");

  await writeAiAuditLog({
    userId: input.userId,
    role: input.role,
    module: "messages",
    action: "suggest-reply-draft",
    decision: "DRAFT",
    metadata: { chars: firewall.sanitizedText.length },
  });

  return {
    draft,
    disclaimer:
      "Conteúdo gerado por IA. Confirme antes de enviar. Não inclui dados financeiros ou documentos.",
  };
}

import OpenAI from "openai";
import { prisma } from "@ecopet/database";
import { asOptionalInputJson } from "../lib/prisma-json.js";

export const HEALTH_DISCLAIMER =
  "As orientações da ECOPET não substituem avaliação veterinária presencial.";

const SUPPORT_SYSTEM_PROMPT = `Você é a assistente virtual da ECOPET, plataforma premium para pets.
Responda em português brasileiro, de forma clara e empática.
Você pode ajudar com: cadastro, login, marketplace, serviços, ONGs, parceiros, agendamentos e navegação.
NUNCA: diagnóstico veterinário definitivo, prometer cura, confirmar pagamentos, afirmar integrações não configuradas, expor dados de outros usuários.
Para visitantes sem conta: não afirme que está consultando pedidos ou dados privados inexistentes.
Sempre termine respostas sobre saúde com: "${HEALTH_DISCLAIMER}"`;

export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED !== "false" && process.env.SUPPORT_AI_ENABLED !== "false";
}

export async function generateChatAiReply(params: {
  message: string;
  userId?: string;
  guestSessionId?: string;
  conversationId?: string;
  isGuest?: boolean;
  context?: string;
}): Promise<{ reply: string; model: string | null; available: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey || !isAiEnabled()) {
    return {
      available: false,
      model: null,
      reply:
        "Assistente de IA indisponível no momento. Nossa equipe de suporte humano responderá em breve. " +
        HEALTH_DISCLAIMER,
    };
  }

  let userContext = params.context ?? "";
  if (params.userId && !params.isGuest) {
    const orders = await prisma.order.count({ where: { userId: params.userId } });
    if (orders > 0) userContext += `\nUsuário possui ${orders} pedido(s) registrado(s).`;
  }

  const guestNote = params.isGuest
    ? "\nO usuário é visitante sem conta. Oriente sobre cadastro/login se precisar de recursos privados."
    : "";

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SUPPORT_SYSTEM_PROMPT + guestNote + userContext },
      { role: "user", content: params.message },
    ],
    max_tokens: 700,
  });

  const reply =
    completion.choices[0]?.message?.content?.trim() ||
    "Desculpe, não consegui processar sua mensagem agora.";

  await prisma.aIChatLog.create({
    data: {
      userId: params.userId,
      guestSessionId: params.guestSessionId,
      conversationId: params.conversationId,
      prompt: params.message,
      response: reply,
      model,
      metadata: asOptionalInputJson({ isGuest: params.isGuest ?? false }),
    },
  });

  return { reply, model, available: true };
}

import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { PLATFORM_SUPPORT_SYSTEM_PROMPT } from "@/lib/support/platform-support-knowledge";
import type { SupportCategory } from "@prisma/client";

const GUEST_DAILY_LIMIT = 20;
const AUTH_DAILY_LIMIT = 40;
const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2000;

export type SupportChatContext = {
  pathname?: string;
  locale?: string;
  authStatus?: "anonymous" | "authenticated";
  userRole?: string | null;
  errorCategory?: string | null;
  publicErrorCode?: string | null;
};

export type SupportChatResult = {
  reply: string;
  correlationId: string;
  sessionId: string;
  guestId?: string;
  escalateSuggested: boolean;
  protocol?: string | null;
  available: boolean;
};

function correlationId() {
  return `sup_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function sanitizeUserText(input: string): string {
  return input
    .replace(/ignore\s+(all|previous|above)\s+instructions/gi, "[filtrado]")
    .replace(/system\s*prompt/gi, "[filtrado]")
    .slice(0, MAX_MESSAGE_CHARS)
    .trim();
}

function buildContextBlock(ctx: SupportChatContext): string {
  const lines = [
    `pathname=${ctx.pathname || "/"}`,
    `locale=${ctx.locale || "pt-BR"}`,
    `authStatus=${ctx.authStatus || "anonymous"}`,
    `userRole=${ctx.userRole || "none"}`,
  ];
  if (ctx.errorCategory) lines.push(`errorCategory=${ctx.errorCategory}`);
  if (ctx.publicErrorCode) lines.push(`publicErrorCode=${ctx.publicErrorCode}`);
  return lines.join("\n");
}

async function nextTicketNumber() {
  const last = await prisma.supportTicket.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 1000) + 1;
}

async function ensureGuestSession(guestId: string, sessionId?: string | null) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const existing = await prisma.guestChatSession.findUnique({
    where: { guestId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: MAX_HISTORY } },
  });
  if (existing) {
    if (existing.expiresAt < new Date()) {
      return prisma.guestChatSession.update({
        where: { id: existing.id },
        data: { expiresAt, status: "GUEST", sessionId: sessionId || existing.sessionId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: MAX_HISTORY } },
      });
    }
    return existing;
  }
  return prisma.guestChatSession.create({
    data: {
      guestId,
      sessionId: sessionId || randomUUID(),
      browserId: guestId,
      expiresAt,
      status: "GUEST",
    },
    include: { messages: true },
  });
}

function shouldSuggestEscalation(userMessage: string, assistantReply: string): boolean {
  const blob = `${userMessage}\n${assistantReply}`.toLowerCase();
  return (
    /atendimento humano|falar com|não consegui confirmar|nao consegui confirmar|escalon|ticket|protocolo|humano/.test(
      blob
    ) || /não sei|nao sei|não tenho como confirmar|unable to confirm/.test(assistantReply.toLowerCase())
  );
}

export async function runPlatformSupportChat(params: {
  message: string;
  guestId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  userRole?: string | null;
  context?: SupportChatContext;
  escalate?: boolean;
  category?: SupportCategory;
}): Promise<SupportChatResult> {
  const cid = correlationId();
  const message = sanitizeUserText(params.message);
  if (!message) {
    return {
      reply: "Envie uma mensagem para que eu possa ajudar.",
      correlationId: cid,
      sessionId: params.sessionId || "",
      available: true,
      escalateSuggested: false,
    };
  }

  const guestId = params.guestId?.trim() || null;
  const userId = params.userId ?? null;
  let session = guestId ? await ensureGuestSession(guestId, params.sessionId) : null;

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const usedToday = await prisma.aIChatLog.count({
    where: {
      createdAt: { gte: since },
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(session ? [{ guestSessionId: session.id }] : []),
      ],
    },
  });
  const limit = userId ? AUTH_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  if (usedToday >= limit) {
    return {
      reply:
        "Você atingiu o limite de mensagens do suporte automático por hoje. Posso registrar um atendimento humano se preferir.",
      correlationId: cid,
      sessionId: session?.sessionId || params.sessionId || "",
      guestId: guestId || undefined,
      available: true,
      escalateSuggested: true,
    };
  }

  if (params.escalate) {
    const protocol = await createSupportEscalation({
      userId,
      guestSessionId: session?.id ?? null,
      message,
      category: params.category ?? "OTHER",
      context: params.context,
      correlationId: cid,
    });
    const reply = `Registrei seu atendimento. Protocolo: ${protocol}. Nossa equipe analisará em breve.`;
    if (session) {
      await prisma.guestMessage.create({
        data: {
          sessionId: session.id,
          role: "assistant",
          content: reply,
          metadata: { protocol, correlationId: cid, escalation: true },
        },
      });
    }
    return {
      reply,
      correlationId: cid,
      sessionId: session?.sessionId || params.sessionId || "",
      guestId: guestId || undefined,
      available: true,
      escalateSuggested: false,
      protocol,
    };
  }

  if (session) {
    await prisma.guestMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    });
    await prisma.guestChatSession.update({
      where: { id: session.id },
      data: { messageCount: { increment: 1 } },
    });
  }

  const history =
    session?.messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    })) ?? [];

  let reply: string;
  let available = true;

  if (!AI_CONFIG.apiKey || !AI_CONFIG.globallyEnabled) {
    available = false;
    reply =
      "O suporte automático está temporariamente indisponível. Posso registrar um atendimento para a equipe humana.";
  } else {
    try {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: AI_CONFIG.model,
        temperature: 0.3,
        max_tokens: Math.min(700, AI_CONFIG.maxOutputTokens),
        messages: [
          { role: "system", content: PLATFORM_SUPPORT_SYSTEM_PROMPT },
          {
            role: "system",
            content: `Contexto seguro da sessão:\n${buildContextBlock({
              ...params.context,
              authStatus: userId ? "authenticated" : "anonymous",
              userRole: params.userRole,
            })}`,
          },
          ...history.slice(-MAX_HISTORY),
          { role: "user", content: message },
        ],
      });
      reply =
        completion.choices[0]?.message?.content?.trim() ||
        "Não consegui gerar uma resposta agora. Posso registrar um atendimento humano.";
    } catch (error) {
      console.error(
        JSON.stringify({
          scope: "AI_SUPPORT",
          event: "openai_error",
          correlationId: cid,
          provider: "openai",
          message: error instanceof Error ? error.message.slice(0, 120).replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]") : "unknown",
        })
      );
      available = false;
      reply =
        "Não consegui resolver automaticamente neste momento. Posso registrar um atendimento para a equipe humana.";
    }
  }

  const escalateSuggested = shouldSuggestEscalation(message, reply) || !available;

  if (session) {
    await prisma.guestMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: reply,
        metadata: { correlationId: cid, escalateSuggested },
      },
    });
  }

  await prisma.aIChatLog.create({
    data: {
      userId: userId ?? undefined,
      guestSessionId: session?.id,
      prompt: message,
      response: reply,
      model: AI_CONFIG.model,
      metadata: {
        correlationId: cid,
        pathname: params.context?.pathname,
        module: "platform-support",
      },
    },
  });

  return {
    reply,
    correlationId: cid,
    sessionId: session?.sessionId || params.sessionId || "",
    guestId: guestId || undefined,
    available,
    escalateSuggested,
  };
}

async function createSupportEscalation(params: {
  userId?: string | null;
  guestSessionId?: string | null;
  message: string;
  category: SupportCategory;
  context?: SupportChatContext;
  correlationId: string;
}): Promise<string> {
  if (params.guestSessionId) {
    const existing = await prisma.supportTicket.findUnique({
      where: { guestSessionId: params.guestSessionId },
      select: { number: true },
    });
    if (existing) return `EP-${existing.number}`;
  }

  const number = await nextTicketNumber();
  const ticket = await prisma.supportTicket.create({
    data: {
      number,
      subject: `Suporte automático — ${params.context?.pathname || "geral"}`,
      description: params.message,
      category: params.category,
      priority: "NORMAL",
      status: "OPEN",
      requesterId: params.userId ?? null,
      guestSessionId: params.guestSessionId ?? null,
      metadata: {
        source: "platform-support",
        correlationId: params.correlationId,
        pathname: params.context?.pathname,
        locale: params.context?.locale,
        publicErrorCode: params.context?.publicErrorCode,
      },
    },
  });
  return `EP-${ticket.number}`;
}

export async function getOrCreateGuestSupportBootstrap(guestId: string, sessionId?: string | null) {
  const session = await ensureGuestSession(guestId, sessionId);
  const welcome =
    "Olá. Sou o suporte EccoPet. Como posso ajudar?";
  if (session.messages.length === 0) {
    await prisma.guestMessage.create({
      data: { sessionId: session.id, role: "assistant", content: welcome },
    });
  }
  const fresh = await prisma.guestChatSession.findUniqueOrThrow({
    where: { id: session.id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
  });
  return {
    id: fresh.id,
    guestId: fresh.guestId,
    sessionId: fresh.sessionId,
    status: fresh.status,
    messages: fresh.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

import { prisma } from "@ecopet/database";
import { generateChatAiReply } from "./ai-chat-service.js";
import { createAuditLog } from "./audit-service.js";
import { findOrCreateEcopetSupport, sendMessage } from "./chat-service.js";

const GUEST_MAX_MESSAGES = 50;
const GUEST_WELCOME =
  "Olá! Você pode tirar dúvidas antes de criar conta. Para salvar seu histórico e acessar recursos completos, entre ou cadastre-se.";

const PRIVATE_ACTION_MSG =
  "Para continuar essa ação, é necessário entrar ou criar uma conta.";

function guestExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

function isPrivateIntent(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("meu pedido") ||
    lower.includes("meus pedidos") ||
    lower.includes("agendar") ||
    lower.includes("agendamento") ||
    lower.includes("meu pet") ||
    lower.includes("dados de outro") ||
    lower.includes("cpf de")
  );
}

export async function getOrCreateGuestSession(params: {
  guestId: string;
  sessionId: string;
  browserId?: string;
}) {
  let session = await prisma.guestChatSession.findUnique({
    where: { guestId: params.guestId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (session?.status === "EXPIRED" || (session && session.expiresAt < new Date())) {
    await prisma.guestChatSession.update({
      where: { id: session.id },
      data: { status: "EXPIRED" },
    });
    session = null;
  }

  if (!session) {
    session = await prisma.guestChatSession.create({
      data: {
        guestId: params.guestId,
        sessionId: params.sessionId,
        browserId: params.browserId,
        expiresAt: guestExpiresAt(),
        messages: {
          create: {
            role: "assistant",
            content: GUEST_WELCOME,
            type: "SYSTEM",
          },
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  return session;
}

export async function sendGuestChatMessage(guestId: string, content: string) {
  const session = await prisma.guestChatSession.findUnique({ where: { guestId } });
  if (!session || session.status === "EXPIRED" || session.expiresAt < new Date()) {
    throw new Error("SESSION_EXPIRED");
  }
  if (session.messageCount >= GUEST_MAX_MESSAGES) {
    throw new Error("RATE_LIMIT");
  }
  if (isPrivateIntent(content)) {
    await prisma.guestMessage.create({
      data: { sessionId: session.id, role: "user", content, type: "TEXT" },
    });
    const reply = await prisma.guestMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: PRIVATE_ACTION_MSG,
        type: "SYSTEM",
      },
    });
    await prisma.guestChatSession.update({
      where: { id: session.id },
      data: { messageCount: { increment: 2 }, updatedAt: new Date() },
    });
    return { userMessage: content, assistantMessage: reply };
  }

  await prisma.guestMessage.create({
    data: { sessionId: session.id, role: "user", content, type: "TEXT" },
  });

  const { reply } = await generateChatAiReply({
    message: content,
    guestSessionId: session.id,
    isGuest: true,
  });

  const assistantMessage = await prisma.guestMessage.create({
    data: { sessionId: session.id, role: "assistant", content: reply, type: "AI" },
  });

  await prisma.guestChatSession.update({
    where: { id: session.id },
    data: { messageCount: { increment: 2 }, updatedAt: new Date() },
  });

  return { assistantMessage };
}

export async function convertGuestSessionToUser(guestId: string, userId: string) {
  const session = await prisma.guestChatSession.findUnique({
    where: { guestId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session || session.status === "CONVERTED") {
    return findOrCreateEcopetSupport(userId);
  }

  const conversation = await findOrCreateEcopetSupport(userId);

  for (const msg of session.messages) {
    if (msg.role === "user") {
      await sendMessage({
        conversationId: conversation.id,
        senderId: userId,
        content: msg.content,
        type: "TEXT",
        metadata: { migratedFromGuest: true, guestMessageId: msg.id },
      });
    }
  }

  await prisma.guestChatSession.update({
    where: { id: session.id },
    data: {
      status: "CONVERTED",
      convertedUserId: userId,
      convertedAt: new Date(),
      conversationId: conversation.id,
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    module: "chat",
    resource: "guest_session",
    resourceId: session.id,
    metadata: { guestId, conversationId: conversation.id },
  });

  return conversation;
}

export { GUEST_WELCOME, PRIVATE_ACTION_MSG };

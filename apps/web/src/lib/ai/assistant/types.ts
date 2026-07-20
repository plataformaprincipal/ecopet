import type { UserRole } from "@prisma/client";

export type AssistantPersona = "CLIENT" | "PARTNER" | "ONG" | "ADMIN";

export type ConversationMeta = {
  pinned?: boolean;
  favorite?: boolean;
  archived?: boolean;
};

export type AssistantChatInput = {
  userId: string;
  role: UserRole;
  message: string;
  conversationId?: string;
  locale?: string;
  ip?: string;
  petId?: string;
  signal?: AbortSignal;
};

export type AssistantStreamEvent =
  | {
      type: "status";
      phase: "context" | "tools" | "generating" | "summary";
      agentId?: string;
      disclaimer?: string;
    }
  | { type: "tools"; tools: string[] }
  | { type: "delta"; text: string }
  | {
      type: "done";
      conversationId: string;
      messageId?: string;
      content: string;
      model?: string;
      latencyMs: number;
      module?: string;
      toolsUsed?: string[];
      agentId?: string;
    }
  | { type: "error"; code: string; message: string };

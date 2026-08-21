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
  /** Ação da allowlist para o frontend executar (tema, a11y, navegação). */
  | { type: "client_action"; action: string; payload: Record<string, unknown> }
  /** Prévia de mutação aguardando confirmação explícita do usuário. */
  | {
      type: "confirmation";
      toolName: string;
      preview: unknown;
      message?: string;
      params?: Record<string, unknown>;
    }
  /** Resultado tabular de consultas (produtos, serviços, adoções). */
  | { type: "structured"; kind: string; items: unknown[] }
  | { type: "image"; url: string; prompt: string; revisedPrompt?: string }
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

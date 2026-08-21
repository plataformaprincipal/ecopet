export type AIRecommendation = {
  label: string;
  href: string;
};

export type AIConfirmationStatus = "pending" | "running" | "confirmed" | "cancelled" | "error";

export type AIConfirmation = {
  toolName: string;
  preview: unknown;
  message?: string;
  params: Record<string, unknown>;
  status: AIConfirmationStatus;
  resultMessage?: string;
};

export type AIStructuredBlock = {
  kind: string;
  items: unknown[];
};

export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: AIRecommendation[];
  confirmation?: AIConfirmation;
  structured?: AIStructuredBlock[];
  pending?: boolean;
  /** Fase real do stream (context, tools, generating…) */
  statusPhase?: string;
  imageUrl?: string;
  imagePrompt?: string;
};

export type AIConversation = {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  pinned?: boolean;
  favorite?: boolean;
};

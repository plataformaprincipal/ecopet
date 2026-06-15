export type ApiEnvelope<T> = { success: boolean; data?: T; error?: { code: string; message: string } };

async function chatFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || json.success === false) {
    throw new Error(json.error?.message ?? "Erro na requisição");
  }
  return json.data as T;
}

export const messagesApi = {
  listConversations: (params?: { type?: string; q?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.q) qs.set("q", params.q);
    if (params?.page) qs.set("page", String(params.page));
    return chatFetch<{ items: ConversationItem[]; total: number }>(
      `/api/messages/conversations?${qs}`
    );
  },
  createConversation: (body: { type?: string; participantUserIds: string[]; title?: string }) =>
    chatFetch<{ conversation: ConversationItem }>("/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getConversation: (id: string) =>
    chatFetch<{ conversation: ConversationDetail }>(`/api/messages/conversations/${id}`),
  listMessages: (conversationId: string, cursor?: string) => {
    const qs = cursor ? `?cursor=${cursor}&order=asc` : "?order=asc";
    return chatFetch<{ items: ChatMessage[]; nextCursor: string | null }>(
      `/api/messages/conversations/${conversationId}/messages${qs}`
    );
  },
  sendMessage: (
    conversationId: string,
    content: string,
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      mimeType: string;
      fileSize: number;
      storageProvider: string;
    }>
  ) =>
    chatFetch<{ message: ChatMessage }>(`/api/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, attachments }),
    }),
  markRead: (conversationId: string) =>
    chatFetch(`/api/messages/conversations/${conversationId}/read`, { method: "PATCH" }),
  reportMessage: (messageId: string, reason: string, description?: string) =>
    chatFetch(`/api/messages/${messageId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, description }),
    }),
  blockUser: (userId: string, reason?: string) =>
    chatFetch(`/api/messages/users/${userId}/block`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export const supportApi = {
  listTickets: (q?: string) =>
    chatFetch<{ items: SupportTicketItem[] }>(`/api/support/tickets${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createTicket: (body: { subject: string; description: string; category?: string; priority?: string }) =>
    chatFetch<{ ticket: SupportTicketItem }>("/api/support/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getTicket: (id: string) => chatFetch<{ ticket: SupportTicketItem }>(`/api/support/tickets/${id}`),
  sendTicketMessage: (ticketId: string, content: string) =>
    chatFetch(`/api/support/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  updateTicket: (ticketId: string, body: Record<string, unknown>) =>
    chatFetch(`/api/support/tickets/${ticketId}/messages`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export type ConversationItem = {
  id: string;
  type: string;
  status: string;
  title: string | null;
  unreadCount: number;
  lastMessage: { content: string; senderName: string; createdAt: string } | null;
  participants: Array<{ id: string; name: string; role: string; avatarUrl: string | null }>;
};

export type ConversationDetail = ConversationItem & {
  permissions: { canSend: boolean; canArchive: boolean; canMute: boolean; canBlock: boolean };
};

export type ChatMessage = {
  id: string;
  senderId: string;
  sender: { id: string; name: string; role: string; avatarUrl: string | null };
  content: string;
  type: string;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  attachments: Array<{ id: string; url: string; fileName: string; mimeType: string | null }>;
};

export type SupportTicketItem = {
  id: string;
  number: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  conversation?: { id: string };
};

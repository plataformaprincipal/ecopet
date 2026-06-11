import { api } from "@/lib/api";
import { getGuestId, getGuestSessionId } from "./guest-id";

export interface ApiChatMessage {
  id: string;
  content: string;
  createdAt: string;
  type?: string;
  read?: boolean;
  sender: { id: string; name: string; avatar: string | null; role: string };
}

export interface ApiConversation {
  id: string;
  title: string | null;
  type: string;
  status?: string;
  updatedAt?: string;
  lastMessage?: string;
  unreadCount?: number;
  participants?: { user: { id: string; name: string; avatar: string | null; role: string } }[];
  messages?: { content: string; createdAt: string }[];
}

export interface GuestMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface GuestSession {
  id: string;
  guestId: string;
  status: string;
  messages: GuestMessage[];
}

export async function openSupportConversation(token: string) {
  return api<ApiConversation>("/api/chats/support", { method: "POST", token, body: "{}" });
}

export async function fetchConversations(token: string) {
  return api<ApiConversation[]>("/api/chats", { token });
}

export async function fetchConversationMessages(token: string, conversationId: string) {
  return api<ApiChatMessage[]>(`/api/chats/${conversationId}/messages`, { token });
}

export async function sendConversationMessage(
  token: string,
  conversationId: string,
  content: string,
  triggerAi = true
) {
  return api<ApiChatMessage>(`/api/chats/${conversationId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify({ content, type: "TEXT", triggerAi }),
  });
}

export async function markConversationRead(token: string, conversationId: string) {
  return api<{ ok: boolean }>(`/api/chats/${conversationId}/read`, {
    method: "PATCH",
    token,
    body: "{}",
  });
}

export async function createConversation(
  token: string,
  params: { type: string; title?: string; participantIds: string[] }
) {
  return api<ApiConversation>("/api/chats", {
    method: "POST",
    token,
    body: JSON.stringify(params),
  });
}

export async function requestAiChat(token: string, message: string, conversationId?: string) {
  return api<{ reply: string; available: boolean }>("/api/chats/ai", {
    method: "POST",
    token,
    body: JSON.stringify({ message, conversationId }),
  });
}

export async function initGuestChatSession() {
  const guestId = getGuestId();
  const sessionId = getGuestSessionId();
  return api<GuestSession>("/api/chats/guest/session", {
    method: "POST",
    body: JSON.stringify({ guestId, sessionId, browserId: guestId }),
  });
}

export async function sendGuestMessage(content: string) {
  const guestId = getGuestId();
  return api<{ assistantMessage: GuestMessage }>("/api/chats/guest/messages", {
    method: "POST",
    body: JSON.stringify({ guestId, content }),
  });
}

export async function convertGuestChat(token: string) {
  const guestId = getGuestId();
  return api<ApiConversation>("/api/chats/guest/convert", {
    method: "POST",
    token,
    body: JSON.stringify({ guestId }),
  });
}

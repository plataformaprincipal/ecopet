import { api } from "@/lib/api";

export interface ApiChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null; role: string };
}

export interface ApiConversation {
  id: string;
  title: string | null;
  type: string;
  messages?: { content: string; createdAt: string }[];
}

export async function openSupportConversation(token: string) {
  return api<ApiConversation>("/api/conversations/support/ecopet", {
    method: "POST",
    token,
    body: "{}",
  });
}

export async function fetchConversationMessages(token: string, conversationId: string) {
  return api<ApiChatMessage[]>(`/api/conversations/${conversationId}/messages`, { token });
}

export async function sendConversationMessage(token: string, conversationId: string, content: string) {
  return api<ApiChatMessage>(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify({ content, type: "TEXT" }),
  });
}

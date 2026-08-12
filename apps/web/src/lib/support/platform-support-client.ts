import { getGuestId, getGuestSessionId } from "@/lib/chat/guest-id";

export type SupportDisplayMessage = {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string;
};

export type SupportChatResponse = {
  reply: string;
  correlationId: string;
  sessionId: string;
  guestId?: string;
  escalateSuggested: boolean;
  protocol?: string | null;
  available: boolean;
};

async function postSupport(body: Record<string, unknown>) {
  const res = await fetch("/api/support/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json?.error?.message || "SUPPORT_CHAT_FAILED");
  }
  return json.data;
}

export async function bootstrapSupportChat(authenticated: boolean) {
  const guestId = authenticated ? undefined : getGuestId();
  const sessionId = authenticated ? undefined : getGuestSessionId();
  const data = await postSupport({
    bootstrap: true,
    guestId,
    sessionId,
    context: {
      pathname: typeof window !== "undefined" ? window.location.pathname : "/",
      locale: typeof document !== "undefined" ? document.documentElement.lang : "pt-BR",
    },
  });
  return data.session as {
    id: string;
    messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
  };
}

export async function sendSupportChatMessage(params: {
  message: string;
  authenticated: boolean;
  escalate?: boolean;
  category?: string;
}) {
  const guestId = params.authenticated ? undefined : getGuestId();
  const sessionId = params.authenticated ? undefined : getGuestSessionId();
  return (await postSupport({
    message: params.message,
    guestId,
    sessionId,
    escalate: params.escalate,
    category: params.category,
    context: {
      pathname: typeof window !== "undefined" ? window.location.pathname : "/",
      locale: typeof document !== "undefined" ? document.documentElement.lang : "pt-BR",
    },
  })) as SupportChatResponse;
}

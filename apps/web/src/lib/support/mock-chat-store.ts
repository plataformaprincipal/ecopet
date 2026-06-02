export interface SupportChatMessage {
  id: string;
  content: string;
  sender: "user" | "system";
  createdAt: string;
}

const STORAGE_KEY = "ecopet_support_chat_v1";

function load(): SupportChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SupportChatMessage[]) : [];
  } catch {
    return [];
  }
}

function save(messages: SupportChatMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function getMockSupportMessages(): SupportChatMessage[] {
  const existing = load();
  if (existing.length === 0) {
    const welcome: SupportChatMessage = {
      id: "welcome",
      content: "Olá! Sou o assistente ECOPET. Como posso ajudar você hoje?",
      sender: "system",
      createdAt: new Date().toISOString(),
    };
    save([welcome]);
    return [welcome];
  }
  return existing;
}

export function sendMockSupportMessage(content: string): SupportChatMessage[] {
  const trimmed = content.trim();
  if (!trimmed) return load();

  const userMsg: SupportChatMessage = {
    id: `u-${Date.now()}`,
    content: trimmed,
    sender: "user",
    createdAt: new Date().toISOString(),
  };

  const autoReply: SupportChatMessage = {
    id: `s-${Date.now()}`,
    content:
      "Recebemos sua mensagem. Nossa equipe de suporte responderá em breve (seg–sex, 8h–18h). Para urgências, ligue (83) 99617-5215.",
    sender: "system",
    createdAt: new Date(Date.now() + 500).toISOString(),
  };

  const next = [...load(), userMsg, autoReply];
  save(next);
  return next;
}

export function clearMockSupportUnread() {
  /* reservado para badge futura */
}

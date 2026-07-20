/**
 * Sanitização de texto antes de enviar à OpenAI.
 * Não substitui política de contexto (não carregar PII do banco).
 */

const BLOCKED_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "cpf", re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
  { id: "email", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { id: "phone_br", re: /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}\b/g },
  { id: "jwt", re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  { id: "bearer", re: /\bBearer\s+[A-Za-z0-9._\-]+\b/gi },
  { id: "card", re: /\b(?:\d[ -]*?){13,19}\b/g },
  { id: "cvv", re: /\bcvv[:\s]*\d{3,4}\b/gi },
  { id: "pix_key_like", re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi },
  { id: "password_assignment", re: /\b(password|senha|passwd)\s*[:=]\s*\S+/gi },
  { id: "authorization", re: /\bAuthorization\s*[:=]\s*\S+/gi },
];

export function sanitizeAiUserText(input: string): {
  text: string;
  redacted: string[];
} {
  let text = String(input ?? "");
  const redacted: string[] = [];
  for (const p of BLOCKED_PATTERNS) {
    if (p.re.test(text)) {
      redacted.push(p.id);
      text = text.replace(p.re, `[REDACTED_${p.id.toUpperCase()}]`);
    }
    p.re.lastIndex = 0;
  }
  return { text, redacted };
}

export function sanitizeAiMessages(
  messages: Array<{ role: string; content: string }>
): {
  messages: Array<{ role: string; content: string }>;
  redacted: string[];
} {
  const all = new Set<string>();
  const out = messages.map((m) => {
    if (m.role === "system") return m;
    const { text, redacted } = sanitizeAiUserText(m.content);
    redacted.forEach((r) => all.add(r));
    return { ...m, content: text };
  });
  return { messages: out, redacted: [...all] };
}

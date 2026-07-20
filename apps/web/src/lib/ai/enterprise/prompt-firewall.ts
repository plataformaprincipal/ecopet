import { sanitizeAiUserText } from "@/lib/ai/utils/sanitize-input";
import type { FirewallDecision, FirewallResult, SecurityCategory, SecuritySeverity } from "./types";

const INJECTION_PATTERNS: Array<{ re: RegExp; category: SecurityCategory; severity: SecuritySeverity }> = [
  { re: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i, category: "prompt_injection", severity: "high" },
  { re: /disregard\s+(your|the)\s+(system|developer)\s+(prompt|message)/i, category: "prompt_injection", severity: "high" },
  { re: /you\s+are\s+now\s+(DAN|jailbreak|unrestricted)/i, category: "jailbreak", severity: "critical" },
  { re: /\b(jailbreak|do\s+anything\s+now)\b/i, category: "jailbreak", severity: "high" },
  { re: /reveal\s+(your|the)\s+(system\s+prompt|instructions|hidden\s+prompt)/i, category: "prompt_leakage", severity: "high" },
  { re: /mostre\s+(o\s+)?(prompt\s+do\s+sistema|instru[cç][oõ]es\s+internas)/i, category: "prompt_leakage", severity: "high" },
  { re: /exfiltrat(e|ion)|dump\s+(all\s+)?(secrets|env|tokens|api\s*keys)/i, category: "data_exfiltration", severity: "critical" },
  { re: /\b(OPENAI_API_KEY|DATABASE_URL|process\.env)\b/, category: "data_exfiltration", severity: "critical" },
  { re: /execute\s+(all\s+)?tools?\s+(without|bypass)\s+(permission|auth)/i, category: "tool_abuse", severity: "high" },
  { re: /<\s*script|javascript:|data:text\/html/i, category: "indirect_injection", severity: "medium" },
  { re: /\[SYSTEM\]|<<\s*SYS\s*>>|BEGIN\s+SYSTEM\s+PROMPT/i, category: "prompt_injection", severity: "high" },
];

const SENSITIVE_HARD_BLOCK =
  /\b(Authorization:\s*Bearer\s+\S+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|-----BEGIN (RSA |EC )?PRIVATE KEY-----)/i;

function worstSeverity(list: SecuritySeverity[]): SecuritySeverity {
  const order: SecuritySeverity[] = ["low", "medium", "high", "critical"];
  return list.reduce((a, b) => (order.indexOf(b) > order.indexOf(a) ? b : a), "low");
}

/**
 * Prompt Firewall reutilizável — injection, jailbreak, leakage, exfiltração, tool abuse.
 * Não substitui OpenAI Moderation; complementa.
 */
export function runPromptFirewall(raw: string, opts?: { userId?: string }): FirewallResult {
  const trimmed = (raw ?? "").trim().slice(0, 20_000);
  const categories: SecurityCategory[] = [];
  const severities: SecuritySeverity[] = [];

  if (SENSITIVE_HARD_BLOCK.test(trimmed)) {
    return {
      decision: "BLOCK",
      categories: ["data_exfiltration", "sensitive_input"],
      severity: "critical",
      reason: "Credencial ou token detectado na entrada.",
      sanitizedText: "",
    };
  }

  for (const p of INJECTION_PATTERNS) {
    if (p.re.test(trimmed)) {
      categories.push(p.category);
      severities.push(p.severity);
    }
  }

  const { text: sanitized, redacted } = sanitizeAiUserText(trimmed);
  if (redacted.length && !categories.includes("sensitive_input")) {
    categories.push("sensitive_input");
    severities.push("medium");
  }

  void opts?.userId;

  if (!categories.length) {
    return { decision: "ALLOW", categories: [], severity: "low", sanitizedText: sanitized };
  }

  const severity = worstSeverity(severities);
  let decision: FirewallDecision = "SANITIZE";
  if (severity === "critical" || categories.includes("jailbreak") || categories.includes("data_exfiltration")) {
    decision = "BLOCK";
  } else if (categories.includes("prompt_injection") || categories.includes("prompt_leakage")) {
    decision = severity === "high" ? "BLOCK" : "SANITIZE";
  }

  return {
    decision,
    categories: [...new Set(categories)],
    severity,
    reason:
      decision === "BLOCK"
        ? "Entrada bloqueada pelo Prompt Firewall."
        : "Entrada sanitizada pelo Prompt Firewall.",
    sanitizedText: decision === "BLOCK" ? "" : sanitized,
  };
}

export function assertFirewallAllows(result: FirewallResult): void {
  if (result.decision === "BLOCK") {
    const err = new Error(result.reason ?? "FIREWALL_BLOCK");
    (err as Error & { code?: string }).code = "AI_FIREWALL_BLOCK";
    throw err;
  }
}

export type SecurityCategory =
  | "prompt_injection"
  | "jailbreak"
  | "prompt_leakage"
  | "data_exfiltration"
  | "tool_abuse"
  | "sensitive_input"
  | "indirect_injection";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export type FirewallDecision = "ALLOW" | "SANITIZE" | "BLOCK";

export type FirewallResult = {
  decision: FirewallDecision;
  categories: SecurityCategory[];
  severity: SecuritySeverity;
  reason?: string;
  sanitizedText: string;
};

export type EnterpriseToolCall = {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type EnterpriseGenerateWithToolsResult = {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  toolCalls: EnterpriseToolCall[];
  rounds: number;
  latencyMs: number;
  api: "responses" | "chat_completions";
};

import { createHash } from "crypto";

const WRITE_TOOLS = new Set(["add_to_cart", "create_support_ticket", "prepare_appointment"]);

export function isMutatingAiTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName);
}

export function deriveIdempotencyKey(
  userId: string,
  toolName: string,
  params: Record<string, unknown>,
  clientKey?: string
): string {
  if (clientKey?.trim()) return clientKey.trim().slice(0, 128);
  const stable = JSON.stringify({ userId, toolName, params });
  const hash = createHash("sha256").update(stable).digest("hex").slice(0, 32);
  return `${toolName}:${hash}`;
}

/**
 * Transporte Better Stack via @logtail/node (server-only).
 * Falha do transporte nunca derruba a aplicação.
 */
import "server-only";

import { Logtail } from "@logtail/node";
import {
  getBetterStackConfig,
  isBetterStackConfigured,
  isObservabilityFlagEnabled,
} from "./config";
import { redactForObservability } from "./redaction";

type LogtailClient = InstanceType<typeof Logtail>;

let client: LogtailClient | null = null;
let lastSuccessAt: string | null = null;
let lastErrorAt: string | null = null;
let lastErrorCode: string | null = null;
let suppressed = 0;

export function getTransportStats() {
  return {
    lastSuccessAt,
    lastErrorAt,
    lastErrorCode,
    suppressed,
    configured: isBetterStackConfigured(),
  };
}

function getClient(): LogtailClient | null {
  if (!isObservabilityFlagEnabled("betterStackLogs")) return null;
  if (!isBetterStackConfigured()) return null;
  if (client) return client;

  const cfg = getBetterStackConfig();
  if (!cfg.sourceToken || !cfg.host) return null;

  try {
    client = new Logtail(cfg.sourceToken, {
      endpoint: cfg.host,
    });
    return client;
  } catch {
    lastErrorAt = new Date().toISOString();
    lastErrorCode = "CLIENT_INIT_FAILED";
    return null;
  }
}

export type TransportLevel = "debug" | "info" | "warn" | "error";

export async function sendToBetterStack(
  level: TransportLevel,
  message: string,
  context: Record<string, unknown>
): Promise<boolean> {
  const logtail = getClient();
  if (!logtail) return false;

  const safe = redactForObservability(context) as Record<string, unknown>;

  try {
    const payload = { message, ...safe };
    if (level === "error") await logtail.error(message, payload);
    else if (level === "warn") await logtail.warn(message, payload);
    else if (level === "debug") await logtail.debug(message, payload);
    else await logtail.info(message, payload);

    // flush best-effort (não bloqueia indefinidamente)
    void logtail.flush().catch(() => undefined);

    lastSuccessAt = new Date().toISOString();
    lastErrorCode = null;
    return true;
  } catch (err) {
    lastErrorAt = new Date().toISOString();
    lastErrorCode = err instanceof Error ? err.name : "TRANSPORT_ERROR";
    suppressed += 1;
    return false;
  }
}

export async function flushBetterStack(): Promise<void> {
  if (!client) return;
  try {
    await client.flush();
  } catch {
    // ignore
  }
}

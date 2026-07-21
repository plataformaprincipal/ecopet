/**
 * Boot logger — evita puxar @logtail/node no grafo de instrumentation/Edge.
 * Emite apenas console estruturado no boot; transporte Better Stack fica para rotas Node.
 */
import {
  getBetterStackConfig,
  isBetterStackConfigured,
  resolveObservabilityEnvironment,
} from "./config";
import { redactForObservability } from "./redaction";

export function logBootEvent(message: string, fields: Record<string, unknown> = {}) {
  const cfg = getBetterStackConfig();
  const entry = redactForObservability({
    timestamp: new Date().toISOString(),
    level: "info",
    message,
    environment: resolveObservabilityEnvironment(),
    service: cfg.serviceName,
    release: cfg.release,
    betterStackConfigured: isBetterStackConfigured(),
    ...fields,
  });
  console.log(JSON.stringify(entry));
}

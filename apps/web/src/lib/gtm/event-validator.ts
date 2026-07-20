import { assertSafeEventName } from "./event-sanitizer";
import type { GtmTelemetryPayload } from "./contract";

export function validateTelemetryPayload(payload: GtmTelemetryPayload): {
  ok: boolean;
  error?: string;
} {
  if (!payload.event || typeof payload.event !== "string") {
    return { ok: false, error: "event obrigatório" };
  }
  if (!assertSafeEventName(payload.event)) {
    return { ok: false, error: "event name inválido" };
  }
  if (payload.ga_event && !assertSafeEventName(payload.ga_event)) {
    return { ok: false, error: "ga_event inválido" };
  }
  if (payload.event_version != null && payload.event_version !== 1) {
    return { ok: false, error: "event_version não suportada" };
  }
  return { ok: true };
}

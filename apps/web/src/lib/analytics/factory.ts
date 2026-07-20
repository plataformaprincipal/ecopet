import type { AnalyticsEventDefinition } from "./events/definitions";
import { findEventDefinition } from "./events/catalog";
import { getClientAnalyticsContext } from "./context";
import type { AnalyticsEventParams } from "./types";

export type TrackableEvent =
  | AnalyticsEventDefinition
  | { event_name: string; category?: string; action?: string; module?: string }
  | string;

export type EventFactoryInput = {
  event: TrackableEvent;
  label?: string;
  value?: number;
  params?: AnalyticsEventParams;
  /** Sobrescreve screen / geo opcionalmente. */
  screen?: string;
  country?: string;
  state?: string;
  city?: string;
};

export type BuiltAnalyticsEvent = {
  name: string;
  params: AnalyticsEventParams;
};

function resolveDefinition(event: TrackableEvent): AnalyticsEventDefinition {
  if (typeof event === "string") {
    const found = findEventDefinition(event);
    return (
      found ?? {
        event_name: event,
        category: "custom",
        action: event,
        module: "custom",
      }
    );
  }
  if ("event_name" in event && event.event_name) {
    const found = findEventDefinition(event.event_name);
    return {
      event_name: event.event_name,
      category: event.category ?? found?.category ?? "custom",
      action: event.action ?? found?.action ?? event.event_name,
      module: event.module ?? found?.module ?? "custom",
    };
  }
  return {
    event_name: "custom_event",
    category: "custom",
    action: "custom",
    module: "custom",
  };
}

/**
 * Event Factory — monta payload tipado com contexto + metadados do catálogo.
 * Nunca inclui senha/token/PII (sanitização posterior no dispatcher).
 */
export function buildAnalyticsEvent(input: EventFactoryInput): BuiltAnalyticsEvent {
  const def = resolveDefinition(input.event);
  const ctx = getClientAnalyticsContext({
    screen: input.screen,
    country: input.country,
    state: input.state,
    city: input.city,
  });

  const params: AnalyticsEventParams = {
    event_category: def.category,
    event_action: def.action,
    event_label: input.label,
    value: input.value,
    module: def.module,
    environment: ctx.environment,
    anonymous_id: ctx.anonymous_id,
    session_id: ctx.session_id,
    user_role: ctx.user_role,
    // user_id só se já setado via setAnalyticsUser (cuid, sem PII)
    user_id: ctx.user_id,
    language: ctx.language,
    device: ctx.device,
    page: ctx.page,
    screen: ctx.screen ?? ctx.page,
    country: ctx.country,
    state: ctx.state,
    city: ctx.city,
    timestamp: ctx.timestamp,
    ...input.params,
  };

  return { name: def.event_name, params };
}

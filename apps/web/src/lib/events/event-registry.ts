import type { PlatformEventInput } from "./event-types";

export type EventHandler = (event: PlatformEventInput & { id: string }) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();
const globalHandlers: EventHandler[] = [];

export function registerEventHandler(eventType: string, handler: EventHandler) {
  const list = handlers.get(eventType) ?? [];
  list.push(handler);
  handlers.set(eventType, list);
}

export function registerGlobalEventHandler(handler: EventHandler) {
  globalHandlers.push(handler);
}

export function getHandlersForEvent(eventType: string): EventHandler[] {
  return [...(handlers.get(eventType) ?? []), ...globalHandlers];
}

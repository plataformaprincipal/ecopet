import { getHandlersForEvent } from "./event-registry";
import type { PlatformEventInput } from "./event-types";

export async function dispatchEvent(event: PlatformEventInput & { id: string }) {
  const handlers = getHandlersForEvent(event.type);
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (e) {
      console.error(`[event-bus] handler failed for ${event.type}:`, e);
    }
  }
}

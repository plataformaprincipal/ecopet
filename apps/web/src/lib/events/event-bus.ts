import { dispatchEvent } from "./event-dispatcher";
import { ensureEventHandlers } from "./event-handlers";
import { logPlatformEventMirror, logSystemEvent } from "./event-logger";
import type { PlatformEventInput } from "./event-types";

export async function emitPlatformEvent(input: PlatformEventInput) {
  ensureEventHandlers();

  const [systemRow] = await Promise.all([
    logSystemEvent(input),
    logPlatformEventMirror(input).catch(() => null),
  ]);

  const event = { ...input, id: systemRow.id, createdAt: systemRow.createdAt.toISOString() };
  await dispatchEvent(event);
  return event;
}

export { PLATFORM_EVENTS } from "./event-types";
export type { PlatformEventInput } from "./event-types";

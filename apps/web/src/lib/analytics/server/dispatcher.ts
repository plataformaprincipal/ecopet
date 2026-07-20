import "server-only";

import { validateDebugEventName } from "./validator";
import { recordOpsError } from "./repository";
import { analyticsServerLog } from "./logger";
import { isSafeEventName, sanitizeEventParams } from "../sanitize";

/**
 * Dispatcher server-side — NÃO envia ao gtag (browser-only).
 * Usado para validar/debugar payloads e registrar falhas operacionais.
 */
export async function dispatchServerDebugEvent(input: {
  name: string;
  params?: Record<string, unknown>;
  dryRun?: boolean;
}): Promise<{
  accepted: boolean;
  dryRun: boolean;
  reason?: string;
  sanitizedParams?: Record<string, string | number | boolean>;
}> {
  if (!validateDebugEventName(input.name) || !isSafeEventName(input.name)) {
    await recordOpsError({
      code: "INVALID_EVENT_NAME",
      message: "Nome de evento inválido no debug server.",
      module: "dispatcher",
    });
    return { accepted: false, dryRun: true, reason: "invalid_event_name" };
  }

  const sanitizedParams = sanitizeEventParams(
    input.params as Record<string, string | number | boolean | null | undefined>
  );

  analyticsServerLog("DEBUG", "server debug-event validated", {
    name: input.name,
    keys: Object.keys(sanitizedParams).length,
  });

  // dryRun default true — nunca faz Measurement Protocol daqui
  return {
    accepted: true,
    dryRun: input.dryRun !== false,
    sanitizedParams,
    reason: "validated_not_sent_server_side",
  };
}

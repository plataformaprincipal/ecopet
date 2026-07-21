import { AsyncLocalStorage } from "async_hooks";
import { isValidCorrelationId, newCorrelationId } from "./redaction";

export type RequestObservabilityContext = {
  correlationId: string;
  requestId?: string;
  route?: string;
  method?: string;
  module?: string;
  userIdHash?: string;
  role?: string;
  organizationIdHash?: string;
};

const storage = new AsyncLocalStorage<RequestObservabilityContext>();

export function getRequestContext(): RequestObservabilityContext | undefined {
  return storage.getStore();
}

export function runWithRequestContext<T>(
  ctx: RequestObservabilityContext,
  fn: () => T
): T {
  return storage.run(ctx, fn);
}

export async function runWithRequestContextAsync<T>(
  ctx: RequestObservabilityContext,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run(ctx, fn);
}

export function resolveCorrelationId(incoming?: string | null): string {
  if (isValidCorrelationId(incoming)) return incoming!;
  return newCorrelationId();
}

export function correlationIdFromHeaders(headers: Headers): string {
  return resolveCorrelationId(
    headers.get("x-correlation-id") ?? headers.get("x-request-id")
  );
}

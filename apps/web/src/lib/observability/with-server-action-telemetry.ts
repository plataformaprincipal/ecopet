import { logStructured } from "./logger";
import { captureError } from "./error-capture";
import { trackMetric, MetricNames } from "./metrics";
import { newCorrelationId, hashIdentifier } from "./redaction";
import { runWithRequestContextAsync } from "./context";

/**
 * Wrapper leve para Server Actions críticas.
 * Não vaza stack; rethrowa erro de domínio após capturar.
 */
export function withServerActionTelemetry<TArgs extends unknown[], TResult>(
  actionName: string,
  fn: (...args: TArgs) => Promise<TResult>,
  options?: { module?: string; getUserId?: (...args: TArgs) => string | undefined }
) {
  return async (...args: TArgs): Promise<TResult> => {
    const correlationId = newCorrelationId();
    const started = Date.now();
    const userId = options?.getUserId?.(...args);
    const moduleName = options?.module ?? "server_action";

    return runWithRequestContextAsync(
      {
        correlationId,
        module: moduleName,
        route: `action:${actionName}`,
        method: "ACTION",
        userIdHash: userId ? hashIdentifier(userId) : undefined,
      },
      async () => {
        try {
          const result = await fn(...args);
          const durationMs = Date.now() - started;
          trackMetric(MetricNames.REQUEST_DURATION_MS, durationMs, {
            module: moduleName,
            action: actionName,
          });
          logStructured("info", `action.${actionName}`, {
            module: moduleName,
            event: "server_action.ok",
            action: actionName,
            correlationId,
            durationMs,
          });
          return result;
        } catch (error) {
          captureError(error, {
            module: moduleName,
            action: actionName,
            correlationId,
            durationMs: Date.now() - started,
          });
          throw error;
        }
      }
    );
  };
}

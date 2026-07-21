import { NextResponse } from "next/server";
import {
  correlationIdFromHeaders,
  runWithRequestContextAsync,
  type RequestObservabilityContext,
} from "./context";
import { hashIdentifier } from "./redaction";
import { logStructured } from "./logger";
import { captureError } from "./error-capture";
import { trackMetric, MetricNames } from "./metrics";

type AuthedUser = { id: string; role?: string } | null | undefined;

/**
 * Wrapper de Route Handler com correlation ID, duração e captura de erro.
 * Não vazia stack para o cliente.
 */
export function withApiTelemetry<TContext = unknown>(
  moduleName: string,
  handler: (
    request: Request,
    context: TContext
  ) => Promise<Response> | Response,
  options?: { getUser?: () => Promise<AuthedUser> | AuthedUser }
) {
  return async (request: Request, context: TContext): Promise<Response> => {
    const started = Date.now();
    const correlationId = correlationIdFromHeaders(request.headers);
    const url = new URL(request.url);

    let user: AuthedUser = null;
    try {
      user = options?.getUser ? await options.getUser() : null;
    } catch {
      user = null;
    }

    const ctx: RequestObservabilityContext = {
      correlationId,
      route: url.pathname,
      method: request.method,
      module: moduleName,
      userIdHash: user?.id ? hashIdentifier(user.id) : undefined,
      role: user?.role,
    };

    return runWithRequestContextAsync(ctx, async () => {
      try {
        const res = await handler(request, context);
        const durationMs = Date.now() - started;
        const status = res.status;

        trackMetric(MetricNames.REQUESTS_TOTAL, 1, {
          module: moduleName,
          method: request.method,
          status,
        });
        trackMetric(MetricNames.REQUEST_DURATION_MS, durationMs, {
          module: moduleName,
          method: request.method,
        });

        if (status >= 500) {
          trackMetric(MetricNames.REQUEST_ERRORS_TOTAL, 1, { module: moduleName });
        }

        logStructured(status >= 500 ? "error" : status >= 400 ? "warn" : "info", "api.request", {
          module: moduleName,
          action: "request",
          event: "api.request",
          statusCode: status,
          durationMs,
          correlationId,
        });

        // Mutar headers no response original — preserva Set-Cookie (login/sessão).
        try {
          res.headers.set("x-correlation-id", correlationId);
          return res;
        } catch {
          const headers = new Headers(res.headers);
          headers.set("x-correlation-id", correlationId);
          return new NextResponse(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers,
          });
        }
      } catch (error) {
        const durationMs = Date.now() - started;
        const captured = captureError(error, {
          module: moduleName,
          route: url.pathname,
          method: request.method,
          correlationId,
          durationMs,
        });
        trackMetric(MetricNames.REQUEST_ERRORS_TOTAL, 1, { module: moduleName });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Erro interno. Use o código de referência no suporte.",
              correlationId: captured.correlationId ?? correlationId,
            },
          },
          {
            status: 500,
            headers: { "x-correlation-id": correlationId },
          }
        );
      }
    });
  };
}

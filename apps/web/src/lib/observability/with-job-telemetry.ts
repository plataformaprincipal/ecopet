import { logStructured } from "./logger";
import { captureError } from "./error-capture";
import { trackMetric } from "./metrics";
import { newCorrelationId } from "./redaction";
import { runWithRequestContextAsync } from "./context";

/**
 * Wrapper para jobs/cron/automações — correlationId próprio, fail-open no logger.
 */
export async function withJobTelemetry<T>(
  jobName: string,
  fn: (ctx: { correlationId: string }) => Promise<T>,
  meta: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  const correlationId = newCorrelationId();
  const started = Date.now();

  return runWithRequestContextAsync(
    {
      correlationId,
      module: "jobs",
      route: `job:${jobName}`,
      method: "JOB",
    },
    async () => {
      logStructured("info", `job.${jobName}.start`, {
        module: "jobs",
        event: "job.start",
        action: jobName,
        correlationId,
        ...meta,
      });

      try {
        const result = await fn({ correlationId });
        const durationMs = Date.now() - started;
        trackMetric("job_duration_ms", durationMs, { job: jobName });
        logStructured("info", `job.${jobName}.ok`, {
          module: "jobs",
          event: "job.complete",
          action: jobName,
          correlationId,
          durationMs,
          ...meta,
        });
        return result;
      } catch (error) {
        const durationMs = Date.now() - started;
        captureError(error, {
          module: "jobs",
          action: jobName,
          correlationId,
          durationMs,
          ...meta,
        });
        trackMetric("job_failures", 1, { job: jobName });
        throw error;
      }
    }
  );
}

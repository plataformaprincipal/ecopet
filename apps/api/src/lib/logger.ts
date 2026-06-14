/** Logs estruturados ECOPET API */
type LogScope = "auth" | "api" | "database" | "proxy";

export function logStructured(scope: LogScope, event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test") return;
  console.log(
    JSON.stringify({
      scope,
      event,
      ...data,
      ts: new Date().toISOString(),
    })
  );
}

import { isGaDebugEnabled } from "./config";

type Level = "debug" | "info" | "warn" | "error";

/** Logger interno — nunca imprime Measurement ID completo nem PII. */
export function analyticsLog(level: Level, message: string, meta?: Record<string, unknown>) {
  if (level === "debug" && !isGaDebugEnabled()) return;
  const prefix = "[ecopet-analytics]";
  const safeMeta = meta
    ? Object.fromEntries(
        Object.entries(meta).filter(
          ([k]) => !/measurement|password|token|email|cpf|cookie/i.test(k)
        )
      )
    : undefined;

  if (typeof console === "undefined") return;
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "info"
          ? console.info
          : console.debug;
  if (safeMeta && Object.keys(safeMeta).length) {
    fn(prefix, message, safeMeta);
  } else {
    fn(prefix, message);
  }
}

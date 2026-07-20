import "server-only";

type Level = "INFO" | "WARNING" | "ERROR" | "DEBUG" | "AUDIT";

const SENSITIVE = /measurement|password|token|secret|cookie|jwt|authorization|email|cpf|card/i;

/** Logger dedicado analytics server — nunca imprime secrets/PII. */
export function analyticsServerLog(
  level: Level,
  message: string,
  meta?: Record<string, unknown>
) {
  const safe = meta
    ? Object.fromEntries(Object.entries(meta).filter(([k]) => !SENSITIVE.test(k)))
    : undefined;
  const prefix = "[ecopet-analytics-server]";
  const line = safe && Object.keys(safe).length ? [prefix, message, safe] : [prefix, message];
  if (level === "ERROR") console.error(...line);
  else if (level === "WARNING") console.warn(...line);
  else if (level === "DEBUG") {
    if (process.env.NEXT_PUBLIC_GA_DEBUG === "1" || process.env.ANALYTICS_SERVER_DEBUG === "1") {
      console.debug(...line);
    }
  } else console.info(...line);
}

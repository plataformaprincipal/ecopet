type Level = "debug" | "info" | "warn" | "error";

export function gtmLog(level: Level, message: string, meta?: Record<string, unknown>) {
  const debug =
    process.env.NEXT_PUBLIC_GTM_DEBUG === "1" ||
    process.env.NEXT_PUBLIC_GA_DEBUG === "1" ||
    process.env.NODE_ENV !== "production";
  if (level === "debug" && !debug) return;
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[ecopet-gtm] ${message}${payload}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

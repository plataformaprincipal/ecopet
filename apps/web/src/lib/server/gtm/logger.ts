import "server-only";

type Level = "DEBUG" | "INFO" | "WARN" | "ERROR" | "AUDIT";

export function gtmServerLog(
  level: Level,
  message: string,
  meta?: Record<string, unknown>
) {
  const safe = meta
    ? Object.fromEntries(
        Object.entries(meta).filter(
          ([k]) => !/token|password|email|cookie|authorization|secret|cpf/i.test(k)
        )
      )
    : undefined;
  const line = `[ecopet-gtm-server] ${level} ${message}${
    safe ? ` ${JSON.stringify(safe)}` : ""
  }`;
  if (level === "ERROR") console.error(line);
  else if (level === "WARN") console.warn(line);
  else console.info(line);
}

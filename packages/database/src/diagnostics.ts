import { Prisma } from "@prisma/client";

/** Host:porta da connection string — sem usuário, senha ou path. */
export function parseDatabaseUrlHost(rawUrl?: string | null): string | null {
  const raw = rawUrl?.trim();
  if (!raw) return null;

  try {
    const normalized = raw.replace(/^postgresql:/i, "postgres:");
    const parsed = new URL(normalized);
    const port = parsed.port || (parsed.protocol === "postgres:" ? "5432" : "");
    return port ? `${parsed.hostname}:${port}` : parsed.hostname;
  } catch {
    return "invalid-url";
  }
}

export type PrismaConnectErrorDetails = {
  name: string;
  code: string;
  message: string;
  meta?: unknown;
};

/** Extrai código/mensagem originais do Prisma (P1000, P1001, P1008, etc.). */
export function extractPrismaConnectError(error: unknown): PrismaConnectErrorDetails {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      meta: error.meta,
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      name: error.name,
      code: error.errorCode ?? "P1000",
      message: error.message,
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      name: error.name,
      code: "RUST_PANIC",
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      code: "UNKNOWN",
      message: error.message,
    };
  }

  return {
    name: "UnknownError",
    code: "UNKNOWN",
    message: String(error),
  };
}

let bootDiagnosticsLogged = false;

export type DatabaseBootDiagnostics = {
  datasourceEnvVar: "DATABASE_URL";
  databaseUrlConfigured: boolean;
  databaseUrlLength: number;
  databaseHost: string | null;
  resolvedHost: string | null;
  directUrlConfigured: boolean;
  directUrlHost: string | null;
  directUrlUsage: "migrations-only (schema.prisma directUrl)";
  vercelAugmentation: boolean;
  runtime: {
    nodeEnv: string | undefined;
    vercel: string | undefined;
  };
};

export function buildDatabaseBootDiagnostics(
  rawDatabaseUrl: string | undefined,
  resolvedDatabaseUrl: string | undefined
): DatabaseBootDiagnostics {
  const raw = rawDatabaseUrl?.trim();
  const resolved = resolvedDatabaseUrl?.trim();

  return {
    datasourceEnvVar: "DATABASE_URL",
    databaseUrlConfigured: Boolean(raw),
    databaseUrlLength: raw?.length ?? 0,
    databaseHost: parseDatabaseUrlHost(raw),
    resolvedHost: parseDatabaseUrlHost(resolved),
    directUrlConfigured: Boolean(process.env.DIRECT_URL?.trim()),
    directUrlHost: parseDatabaseUrlHost(process.env.DIRECT_URL),
    directUrlUsage: "migrations-only (schema.prisma directUrl)",
    vercelAugmentation: process.env.VERCEL === "1",
    runtime: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    },
  };
}

/** Registra host e configuração da DATABASE_URL uma vez por processo (logs Vercel/local). */
export function logDatabaseBootDiagnostics(
  rawDatabaseUrl: string | undefined,
  resolvedDatabaseUrl: string | undefined
): DatabaseBootDiagnostics {
  const diagnostics = buildDatabaseBootDiagnostics(rawDatabaseUrl, resolvedDatabaseUrl);

  if (!bootDiagnosticsLogged) {
    bootDiagnosticsLogged = true;
    console.info("[ecopet/database] boot", JSON.stringify(diagnostics));
  }

  return diagnostics;
}

/** Registra falha de conexão com erro original do Prisma nos logs do servidor. */
export function logPrismaConnectFailure(context: string, error: unknown): PrismaConnectErrorDetails {
  const details = extractPrismaConnectError(error);
  console.error(
    `[ecopet/database] ${context}`,
    JSON.stringify({
      prismaCode: details.code,
      prismaName: details.name,
      prismaMessage: details.message,
      ...(details.meta !== undefined ? { prismaMeta: details.meta } : {}),
    })
  );
  return details;
}

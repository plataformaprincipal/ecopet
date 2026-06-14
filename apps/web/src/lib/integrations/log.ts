import { prisma } from "@/lib/prisma";

const SECRET_PATTERN = /(key|secret|token|pass|password|authorization)/i;

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (SECRET_PATTERN.test(k)) {
      safe[k] = "[redacted]";
    } else if (typeof v === "string" && v.length > 200) {
      safe[k] = `${v.slice(0, 200)}…`;
    } else {
      safe[k] = v;
    }
  }
  return safe;
}

export async function writeIntegrationLog(params: {
  integrationName: string;
  provider: string;
  action: string;
  status: string;
  errorCode?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.platformIntegrationLog.create({
      data: {
        integrationName: params.integrationName,
        provider: params.provider,
        action: params.action,
        status: params.status,
        errorCode: params.errorCode,
        message: params.message,
        metadata: sanitizeMetadata(params.metadata) as object | undefined,
      },
    });
  } catch {
    /* não quebrar fluxo */
  }
}

export async function getRecentIntegrationLogs(limit = 20) {
  const rows = await prisma.platformIntegrationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      integrationName: true,
      provider: true,
      action: true,
      status: true,
      errorCode: true,
      message: true,
      createdAt: true,
    },
  });
  return rows;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { auditProductionEnv } from "@/lib/validate-production-env";
import {
  buildDatabaseBootDiagnostics,
  logPrismaConnectFailure,
} from "@ecopet/database/diagnostics";
import { getResolvedDatabaseUrl } from "@ecopet/database/client";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({
      status: "ok",
      database: "connected",
      service: "ecopet-web",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const configured = Boolean(process.env.DATABASE_URL?.trim());
    const envAudit = auditProductionEnv();
    const prismaError = logPrismaConnectFailure("health check connection failed", error);
    const boot = buildDatabaseBootDiagnostics(process.env.DATABASE_URL, getResolvedDatabaseUrl());
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: configured
            ? "Não foi possível conectar ao banco de dados."
            : "DATABASE_URL não configurada no ambiente de produção.",
        },
        data: {
          databaseConfigured: configured,
          databaseHost: boot.databaseHost,
          resolvedHost: boot.resolvedHost,
          vercelAugmentation: boot.vercelAugmentation,
          prismaCode: prismaError.code,
          prismaMessage: prismaError.message,
          missingCritical: envAudit.critical,
          missingRecommended: envAudit.recommended,
        },
      },
      { status: 503 }
    );
  }
}

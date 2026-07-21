import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { logPrismaConnectFailure } from "@ecopet/database/diagnostics";

/**
 * Health legado — resposta pública mínima.
 * Preferir /api/health/live e /api/health/ready para probes.
 * Em falha: sem hosts, lista de env ou mensagens Prisma detalhadas.
 */
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
    logPrismaConnectFailure("health check connection failed", error);
    const configured = Boolean(process.env.DATABASE_URL?.trim());
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: configured
            ? "Não foi possível conectar ao banco de dados."
            : "Banco de dados não configurado.",
        },
        data: {
          status: "unhealthy",
          database: "unavailable",
          service: "ecopet-web",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}

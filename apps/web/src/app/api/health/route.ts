import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({
      status: "ok",
      database: "connected",
      service: "ecopet-web",
      timestamp: new Date().toISOString(),
    });
  } catch {
    const configured = Boolean(process.env.DATABASE_URL?.trim());
    return apiFailure(
      "DATABASE_UNAVAILABLE",
      configured
        ? "Não foi possível conectar ao banco de dados."
        : "DATABASE_URL não configurada no ambiente de produção.",
      503
    );
  }
}

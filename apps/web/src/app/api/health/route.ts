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
    return apiFailure(
      "DATABASE_UNAVAILABLE",
      "Não foi possível conectar ao banco de dados.",
      503
    );
  }
}

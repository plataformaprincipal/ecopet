import { prisma } from "@/lib/prisma";
import { usernameSchema } from "@/schemas/auth";
import { apiSuccess, apiFailure } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("username") ?? "";
    const parsed = usernameSchema.safeParse(raw);

    if (!parsed.success) {
      return apiFailure("VALIDATION", "Nome de usuário inválido", 400);
    }

    const username = parsed.data;
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return apiSuccess({ username, available: !existing });
  } catch {
    return apiFailure("UNEXPECTED", "Não foi possível verificar o nome de usuário.", 500);
  }
}

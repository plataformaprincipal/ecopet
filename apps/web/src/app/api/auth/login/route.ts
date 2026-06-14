import { NextResponse } from "next/server";
import { AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  sanitizeUser,
  safeUserSelect,
} from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { loginSchema } from "@/schemas/auth";
import { apiSuccess, apiFailure } from "@/lib/api-response";

const BLOCKED_STATUSES: AccountStatus[] = [AccountStatus.REJECTED, AccountStatus.SUSPENDED];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiFailure("INVALID_CREDENTIALS", "Usuário ou senha incorretos.", 401);
    }

    if (BLOCKED_STATUSES.includes(user.accountStatus)) {
      return apiFailure(
        "ACCOUNT_UNAVAILABLE",
        "Sua conta está indisponível. Entre em contato com o suporte ECOPET.",
        403
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return apiFailure("INVALID_CREDENTIALS", "Usuário ou senha incorretos.", 401);
    }

    const token = await createSessionToken(user.id, user.role, user.accountStatus);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: safeUserSelect,
    });

    const redirectTo = dashboardPathForRole(user.role);

    const response = apiSuccess({
      message: "Login realizado com sucesso.",
      user: fullUser ? sanitizeUser(fullUser) : { id: user.id, email: user.email, role: user.role, name: user.name },
      redirectTo,
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[login:error]", error);
    }
    return apiFailure("UNEXPECTED", "Não foi possível fazer login. Tente novamente.", 500);
  }
}

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
import { findUserByLoginIdentifier } from "@/lib/auth/login-identifier";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { loginSchema } from "@/schemas/auth";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { checkAuthRateLimit, clientIp } from "@/lib/rate-limit";
import { isInstitutionalCatalogUser } from "@/lib/catalog/constants";
import {
  LOGIN_ACCOUNT_INACTIVE_MESSAGE,
  LOGIN_ACCOUNT_SUSPENDED_MESSAGE,
  LOGIN_USER_NOT_FOUND_MESSAGE,
  LOGIN_WRONG_PASSWORD_MESSAGE,
} from "@/lib/constants/auth-messages";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkAuthRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { identifier, password } = parsed.data;

    if (!checkAuthRateLimit(`login:id:${identifier.toLowerCase()}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const user = await findUserByLoginIdentifier(prisma, identifier);
    if (!user) {
      return apiFailure("USER_NOT_FOUND", LOGIN_USER_NOT_FOUND_MESSAGE, 401);
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      return apiFailure("ACCOUNT_SUSPENDED", LOGIN_ACCOUNT_SUSPENDED_MESSAGE, 403);
    }

    if (user.accountStatus === AccountStatus.REJECTED) {
      return apiFailure("ACCOUNT_INACTIVE", LOGIN_ACCOUNT_INACTIVE_MESSAGE, 403);
    }

    // PENDING (parceiro/ONG aguardando aprovação) pode autenticar e acessar o
    // painel limitado / página de status. Demais estados não-ativos são bloqueados.
    if (
      user.accountStatus !== AccountStatus.ACTIVE &&
      user.accountStatus !== AccountStatus.PENDING
    ) {
      return apiFailure("ACCOUNT_INACTIVE", LOGIN_ACCOUNT_INACTIVE_MESSAGE, 403);
    }

    if (isInstitutionalCatalogUser(user)) {
      return apiFailure("ACCOUNT_INACTIVE", LOGIN_ACCOUNT_INACTIVE_MESSAGE, 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return apiFailure("WRONG_PASSWORD", LOGIN_WRONG_PASSWORD_MESSAGE, 401);
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

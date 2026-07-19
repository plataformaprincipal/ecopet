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
import { checkDistributedRateLimit, clientIp } from "@/lib/rate-limit";
import { isInstitutionalCatalogUser } from "@/lib/catalog/constants";
import {
  LOGIN_ACCOUNT_INACTIVE_MESSAGE,
  LOGIN_ACCOUNT_SUSPENDED_MESSAGE,
  LOGIN_USER_NOT_FOUND_MESSAGE,
  LOGIN_WRONG_PASSWORD_MESSAGE,
} from "@/lib/constants/auth-messages";
import { auditLogin, auditLoginFailed } from "@/lib/auth/auth-audit";
import { isLoginTurnstileRequired } from "@/lib/turnstile/login-risk";
import { requireTurnstile, TURNSTILE_ACTIONS } from "@/lib/turnstile/server";
import { turnstilePublicMessage } from "@/lib/turnstile/errors";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!(await checkDistributedRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS))) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { identifier, password } = parsed.data;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    if (
      !(await checkDistributedRateLimit(
        `login:id:${identifier.toLowerCase()}`,
        LOGIN_LIMIT,
        LOGIN_WINDOW_MS
      ))
    ) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const turnstileRequired = await isLoginTurnstileRequired({ ip, identifier });
    if (turnstileRequired) {
      if (!body?.turnstileToken) {
        return apiFailure(
          "TURNSTILE_REQUIRED",
          turnstilePublicMessage("TOKEN_MISSING"),
          403
        );
      }
      const turnstileError = await requireTurnstile({
        token: body.turnstileToken,
        expectedAction: TURNSTILE_ACTIONS.LOGIN_RISK,
        request,
        remoteIp: ip,
        flow: "login_risk",
      });
      if (turnstileError) return turnstileError;
    }

    const user = await findUserByLoginIdentifier(prisma, identifier);
    if (!user) {
      void auditLoginFailed({ identifier, reason: "USER_NOT_FOUND", ip, userAgent });
      return apiFailure("USER_NOT_FOUND", LOGIN_USER_NOT_FOUND_MESSAGE, 401);
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      void auditLoginFailed({ userId: user.id, identifier, reason: "ACCOUNT_SUSPENDED", ip, userAgent });
      return apiFailure("ACCOUNT_SUSPENDED", LOGIN_ACCOUNT_SUSPENDED_MESSAGE, 403);
    }

    if (user.accountStatus === AccountStatus.REJECTED) {
      void auditLoginFailed({ userId: user.id, identifier, reason: "ACCOUNT_REJECTED", ip, userAgent });
      return apiFailure("ACCOUNT_INACTIVE", LOGIN_ACCOUNT_INACTIVE_MESSAGE, 403);
    }

    // PENDING (parceiro/ONG aguardando aprovação) pode autenticar e acessar o
    // painel limitado / página de status. Demais estados não-ativos são bloqueados.
    if (
      user.accountStatus !== AccountStatus.ACTIVE &&
      user.accountStatus !== AccountStatus.PENDING
    ) {
      void auditLoginFailed({ userId: user.id, identifier, reason: "ACCOUNT_INACTIVE", ip, userAgent });
      return apiFailure("ACCOUNT_INACTIVE", LOGIN_ACCOUNT_INACTIVE_MESSAGE, 403);
    }

    if (isInstitutionalCatalogUser(user)) {
      void auditLoginFailed({ userId: user.id, identifier, reason: "INSTITUTIONAL_CATALOG", ip, userAgent });
      return apiFailure("ACCOUNT_INACTIVE", LOGIN_ACCOUNT_INACTIVE_MESSAGE, 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      void auditLoginFailed({ userId: user.id, identifier, reason: "WRONG_PASSWORD", ip, userAgent });
      return apiFailure("WRONG_PASSWORD", LOGIN_WRONG_PASSWORD_MESSAGE, 401);
    }

    const token = await createSessionToken(user.id, user.email, user.role, user.accountStatus);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: safeUserSelect,
    });

    const redirectTo = dashboardPathForRole(user.role);

    void auditLogin({ userId: user.id, email: user.email, ip, userAgent });

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

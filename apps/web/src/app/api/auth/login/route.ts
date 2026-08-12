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
import { shouldSkipAuthRateLimitForE2e } from "@/lib/e2e-preview-auth";
import { checkDistributedRateLimit, clientIpForRateLimit } from "@/lib/rate-limit";
import { isInstitutionalCatalogUser } from "@/lib/catalog/constants";
import {
  LOGIN_ACCOUNT_INACTIVE_MESSAGE,
  LOGIN_ACCOUNT_SUSPENDED_MESSAGE,
  LOGIN_INVALID_CREDENTIALS_MESSAGE,
} from "@/lib/constants/auth-messages";
import { auditLogin, auditLoginFailed } from "@/lib/auth/auth-audit";
import { withApiTelemetry } from "@/lib/observability/with-api-telemetry";
import { captureSecurityEvent } from "@/lib/observability/error-capture";
import { trackMetric, MetricNames } from "@/lib/observability/metrics";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

async function loginHandler(request: Request) {
  try {
    const ip = clientIpForRateLimit(request);
    const skipRl = shouldSkipAuthRateLimitForE2e(request);
    if (
      !skipRl &&
      !(await checkDistributedRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS))
    ) {
      trackMetric(MetricNames.RATE_LIMIT_HITS, 1, { module: "auth", route: "login" });
      captureSecurityEvent("rate_limit", { route: "login" });
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
      !skipRl &&
      !(await checkDistributedRateLimit(
        `login:id:${identifier.toLowerCase()}`,
        LOGIN_LIMIT,
        LOGIN_WINDOW_MS
      ))
    ) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const user = await findUserByLoginIdentifier(prisma, identifier);
    if (!user) {
      void auditLoginFailed({ identifier, reason: "USER_NOT_FOUND", ip, userAgent });
      trackMetric(MetricNames.AUTH_FAILURES, 1, { reason: "USER_NOT_FOUND" });
      captureSecurityEvent("login_failed", { reason: "USER_NOT_FOUND" });
      return apiFailure("INVALID_CREDENTIALS", LOGIN_INVALID_CREDENTIALS_MESSAGE, 401);
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      void auditLoginFailed({ userId: user.id, identifier, reason: "ACCOUNT_SUSPENDED", ip, userAgent });
      trackMetric(MetricNames.AUTH_FAILURES, 1, { reason: "ACCOUNT_SUSPENDED" });
      captureSecurityEvent("login_failed", { reason: "ACCOUNT_SUSPENDED", userId: user.id });
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
      trackMetric(MetricNames.AUTH_FAILURES, 1, { reason: "WRONG_PASSWORD" });
      captureSecurityEvent("login_failed", { reason: "WRONG_PASSWORD", userId: user.id });
      return apiFailure("INVALID_CREDENTIALS", LOGIN_INVALID_CREDENTIALS_MESSAGE, 401);
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
    trackMetric(MetricNames.UNHANDLED_ERRORS, 1, { module: "auth" });
    return apiFailure("UNEXPECTED", "Não foi possível fazer login. Tente novamente.", 500);
  }
}

export const POST = withApiTelemetry("auth", loginHandler);

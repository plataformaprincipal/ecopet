import { cookies } from "next/headers";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-session";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { isAllowedGoogleRole } from "@/lib/auth/google-oauth";
import {
  GOOGLE_PENDING_COOKIE,
  completeGoogleOnboarding,
  readPendingGoogleIdentity,
} from "@/lib/auth/google-oauth-service";
import { checkDistributedRateLimit, clientIpForRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIpForRateLimit(req);
  if (!(await checkDistributedRateLimit(`google-complete:${ip}`, 10, 15 * 60 * 1000))) {
    return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
  }

  const jar = await cookies();
  const identity = await readPendingGoogleIdentity(jar.get(GOOGLE_PENDING_COOKIE)?.value);
  if (!identity) {
    return apiFailure("EXPIRED", "Sessão Google expirada. Tente entrar novamente.", 401);
  }

  const body = (await req.json().catch(() => ({}))) as {
    role?: string;
    termsAccepted?: boolean;
    privacyAccepted?: boolean;
  };
  if (!isAllowedGoogleRole(body.role ?? "")) {
    return apiFailure("ADMIN_FORBIDDEN", "Escolha Cliente, Parceiro ou ONG.", 400);
  }

  const completed = await completeGoogleOnboarding({
    identity,
    role: body.role!,
    termsAccepted: Boolean(body.termsAccepted),
    privacyAccepted: Boolean(body.privacyAccepted),
  });
  if (!completed.ok) return apiFailure(completed.code, completed.code, 409);

  const token = await createSessionToken(
    completed.userId,
    completed.email,
    completed.role,
    completed.accountStatus
  );
  const response = apiSuccess({
    redirectTo: dashboardPathForRole(completed.role),
    role: completed.role,
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  response.cookies.set(GOOGLE_PENDING_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}

export async function GET() {
  const jar = await cookies();
  const identity = await readPendingGoogleIdentity(jar.get(GOOGLE_PENDING_COOKIE)?.value);
  if (!identity) return apiFailure("EXPIRED", "Sessão Google expirada.", 401);
  return apiSuccess({ email: identity.email, name: identity.name });
}

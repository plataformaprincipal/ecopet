import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from "@/lib/auth-session";
import { getAuthoritativeAccountStatus } from "@/lib/account-status-server";
import { apiSuccess, apiFailure } from "@/lib/api-response";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return apiFailure("UNAUTHORIZED", "Sem sessão.", 401);
  }

  try {
    const jwt = await verifySessionToken(token);
    const authoritative = await getAuthoritativeAccountStatus(jwt.userId);
    if (!authoritative) {
      return apiFailure("UNAUTHORIZED", "Usuário não encontrado.", 401);
    }

    const refreshed =
      jwt.accountStatus !== authoritative.accountStatus ||
      jwt.role !== authoritative.role ||
      jwt.email !== authoritative.email;

    const response = apiSuccess({
      userId: authoritative.userId,
      role: authoritative.role,
      accountStatus: authoritative.accountStatus,
      refreshed,
    });

    if (refreshed) {
      const newToken = await createSessionToken(
        authoritative.userId,
        authoritative.email,
        authoritative.role,
        authoritative.accountStatus
      );
      response.cookies.set(SESSION_COOKIE, newToken, sessionCookieOptions());
    }

    return response;
  } catch {
    return apiFailure("UNAUTHORIZED", "Sessão inválida.", 401);
  }
}

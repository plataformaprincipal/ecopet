import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { verifySessionToken } from "@/lib/auth-session";
import { apiSuccess } from "@/lib/api-response";
import { auditLogout } from "@/lib/auth/auth-audit";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  let userId: string | undefined;

  if (token) {
    try {
      const jwt = await verifySessionToken(token);
      userId = jwt.userId;
    } catch {
      /* token inválido */
    }
  }

  void auditLogout({ userId });

  const response = apiSuccess({ message: "Sessão encerrada." });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}

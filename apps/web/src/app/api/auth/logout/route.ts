import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { verifySessionToken } from "@/lib/auth-session";
import { GOOGLE_OAUTH_COOKIE, GOOGLE_PENDING_COOKIE } from "@/lib/auth/google-oauth-service";
import { apiSuccess } from "@/lib/api-response";
import { auditLogout } from "@/lib/auth/auth-audit";
import { deactivateCurrentDevice } from "@/lib/firebase/token-management";

export async function POST(req: Request) {
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

  // Desativa apenas o dispositivo atual (FCM) — best-effort, nunca quebra logout
  if (userId) {
    try {
      let deviceId: string | undefined;
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = (await req.json().catch(() => null)) as { deviceId?: string } | null;
        deviceId = body?.deviceId?.trim();
      }
      if (deviceId) {
        await deactivateCurrentDevice(userId, deviceId);
      }
    } catch {
      /* FCM indisponível não bloqueia logout */
    }
  }

  void auditLogout({ userId });

  const response = apiSuccess({ message: "Sessão encerrada." });
  const cleared = { ...sessionCookieOptions(), maxAge: 0 };
  response.cookies.set(SESSION_COOKIE, "", cleared);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, "", cleared);
  response.cookies.set(GOOGLE_PENDING_COOKIE, "", cleared);
  return response;
}

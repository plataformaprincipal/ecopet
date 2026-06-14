import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ message: "Sessão encerrada." });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}

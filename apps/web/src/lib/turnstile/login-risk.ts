import "server-only";

import { prisma } from "@/lib/prisma";
import {
  LOGIN_TURNSTILE_FAILURE_THRESHOLD,
  LOGIN_TURNSTILE_WINDOW_MS,
} from "./constants";
import { isTurnstileServerEnabled } from "./server-config";

/**
 * Determina se o login deve exigir Turnstile (proteção progressiva).
 * Conta falhas recentes em LoginLog por IP e por identificador.
 */
export async function isLoginTurnstileRequired(input: {
  ip: string;
  identifier: string;
}): Promise<boolean> {
  if (!isTurnstileServerEnabled()) return false;

  const since = new Date(Date.now() - LOGIN_TURNSTILE_WINDOW_MS);
  const identifier = input.identifier.trim().toLowerCase();

  try {
    const [byIp, byIdentifier] = await Promise.all([
      prisma.loginLog.count({
        where: {
          success: false,
          createdAt: { gte: since },
          ip: input.ip === "unknown" ? undefined : input.ip,
        },
      }),
      prisma.loginLog.count({
        where: {
          success: false,
          createdAt: { gte: since },
          OR: [
            { email: { equals: identifier, mode: "insensitive" } },
            { username: { equals: identifier, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return (
      byIp >= LOGIN_TURNSTILE_FAILURE_THRESHOLD ||
      byIdentifier >= LOGIN_TURNSTILE_FAILURE_THRESHOLD
    );
  } catch {
    // Em falha de DB, não exigir desafio extra (rate limit ainda protege).
    return false;
  }
}

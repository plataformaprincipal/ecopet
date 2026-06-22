import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { verifySessionToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import type { AccessibilityPreferences } from "@/lib/accessibility/types";

export type UserPreferencesJson = {
  a11y?: Partial<AccessibilityPreferences>;
  locale?: string;
  [key: string]: unknown;
};

function asInputJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Sessão via cookie ou Bearer JWT (mesmo token da sessão EcoPet). */
export async function resolveAuthenticatedUserId(request: Request): Promise<string | null> {
  const cookieUser = await getCurrentUser();
  if (cookieUser) return cookieUser.id;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      const { userId } = await verifySessionToken(auth.slice(7).trim());
      return userId;
    } catch {
      return null;
    }
  }
  return null;
}

export async function getUserPreferences(userId: string): Promise<UserPreferencesJson> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  if (!user?.preferences || typeof user.preferences !== "object") {
    return {};
  }
  return user.preferences as UserPreferencesJson;
}

export async function mergeUserPreferences(
  userId: string,
  patch: { a11y?: Partial<AccessibilityPreferences>; locale?: string }
): Promise<UserPreferencesJson> {
  const current = await getUserPreferences(userId);
  const updated: UserPreferencesJson = {
    ...current,
    ...(patch.a11y ? { a11y: patch.a11y } : {}),
    ...(patch.locale ? { locale: patch.locale } : {}),
  };

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: asInputJson(updated) },
  });

  return updated;
}

import "server-only";

import { getOrCreatePreferences } from "@/lib/notifications/notification-service";
import type { PushCategory } from "./types";

type Prefs = Awaited<ReturnType<typeof getOrCreatePreferences>>;

export function categoryAllowedByPrefs(prefs: Prefs, category: PushCategory): boolean {
  if (!prefs.pushEnabled && category !== "security") return false;

  switch (category) {
    case "security":
      return Boolean(prefs.securityUpdates);
    case "marketing":
      return Boolean(prefs.marketingEnabled) && Boolean(prefs.pushEnabled);
    case "orders":
    case "payments":
    case "deliveries":
      return Boolean(prefs.orderUpdates);
    case "appointments":
      return Boolean(prefs.appointmentUpdates);
    case "social":
      return Boolean(prefs.socialUpdates);
    case "messages":
      return Boolean(prefs.pushEnabled);
    case "support":
      return Boolean(prefs.pushEnabled);
    case "admin":
      return Boolean(prefs.pushEnabled);
    default:
      return Boolean(prefs.pushEnabled);
  }
}

export async function canSendPushToUser(
  userId: string,
  category: PushCategory
): Promise<{ allowed: boolean; reason?: string }> {
  const prefs = await getOrCreatePreferences(userId);

  if (category === "security") {
    return prefs.securityUpdates
      ? { allowed: true }
      : { allowed: false, reason: "SKIPPED_PREFERENCE_SECURITY" };
  }

  if (!prefs.pushEnabled) {
    return { allowed: false, reason: "SKIPPED_PUSH_DISABLED" };
  }

  if (!categoryAllowedByPrefs(prefs, category)) {
    return {
      allowed: false,
      reason:
        category === "marketing"
          ? "SKIPPED_MARKETING_CONSENT"
          : "SKIPPED_CATEGORY_PREFERENCE",
    };
  }

  return { allowed: true };
}

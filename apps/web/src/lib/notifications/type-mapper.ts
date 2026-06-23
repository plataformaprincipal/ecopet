import type { NotificationPriority, NotificationType, UserRole } from "@prisma/client";

const LEGACY_TYPE_MAP: Record<string, NotificationType> = {
  social_post_liked: "SOCIAL",
  social_post_commented: "SOCIAL",
  social_comment_replied: "SOCIAL",
  social_post_shared: "SOCIAL",
  social_new_follower: "SOCIAL",
  social_report_received: "SOCIAL",
  social_moderation_applied: "SOCIAL",
  ORDER_CREATED: "ORDER",
  ORDER_RECEIVED: "ORDER",
  ORDER_STATUS_UPDATED: "ORDER",
  ORDER_CANCELLED: "ORDER",
  APPOINTMENT_CREATED: "APPOINTMENT",
  APPOINTMENT_RECEIVED: "APPOINTMENT",
  APPOINTMENT_CONFIRMED: "APPOINTMENT",
  APPOINTMENT_CANCELLED_BY_CLIENT: "APPOINTMENT",
  APPOINTMENT_CANCELLED_BY_PARTNER: "APPOINTMENT",
  APPOINTMENT_COMPLETED: "APPOINTMENT",
  APPOINTMENT_NO_SHOW: "APPOINTMENT",
  APPOINTMENT_UPDATED: "APPOINTMENT",
  MESSAGE_RECEIVED: "MESSAGE",
  SUPPORT_TICKET_CREATED: "SUPPORT",
  PASSWORD_CHANGED: "SECURITY",
};

export function normalizeNotificationType(type: NotificationType | string): NotificationType {
  if (typeof type !== "string") return type;
  const upper = type.toUpperCase();
  if (upper in LEGACY_TYPE_MAP) return LEGACY_TYPE_MAP[upper];
  if (type.startsWith("social_")) return "SOCIAL";
  if (upper.startsWith("ORDER")) return "ORDER";
  if (upper.startsWith("APPOINTMENT")) return "APPOINTMENT";
  if (upper.startsWith("MESSAGE")) return "MESSAGE";
  if (upper.startsWith("PRODUCT")) return "PRODUCT";
  if (upper.startsWith("SERVICE")) return "SERVICE";
  if (upper.startsWith("ADOPTION")) return "ADOPTION";
  if (upper.startsWith("CAMPAIGN")) return "CAMPAIGN";
  if (upper.startsWith("DOCUMENT")) return "DOCUMENT";
  if (upper.startsWith("PAYMENT")) return "PAYMENT";
  if (upper.startsWith("REVIEW")) return "REVIEW";
  if (upper.startsWith("SECURITY") || upper.startsWith("PASSWORD")) return "SECURITY";
  if (upper.startsWith("SUPPORT")) return "SUPPORT";
  if (Object.values(LEGACY_TYPE_MAP).includes(upper as NotificationType)) return upper as NotificationType;
  return "SYSTEM";
}

export function typeToPreferenceKey(type: NotificationType): keyof Pick<
  import("@prisma/client").NotificationPreference,
  | "orderUpdates"
  | "appointmentUpdates"
  | "socialUpdates"
  | "adoptionUpdates"
  | "campaignUpdates"
  | "productUpdates"
  | "serviceUpdates"
  | "securityUpdates"
> {
  switch (type) {
    case "ORDER":
    case "PAYMENT":
      return "orderUpdates";
    case "APPOINTMENT":
      return "appointmentUpdates";
    case "SOCIAL":
    case "MESSAGE":
      return "socialUpdates";
    case "ADOPTION":
      return "adoptionUpdates";
    case "CAMPAIGN":
      return "campaignUpdates";
    case "PRODUCT":
      return "productUpdates";
    case "SERVICE":
      return "serviceUpdates";
    case "SECURITY":
      return "securityUpdates";
    default:
      return "orderUpdates";
  }
}

export type CreateNotificationInput = {
  userId: string;
  role?: UserRole;
  type: NotificationType | string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
};

export function extractActionUrl(metadata?: Record<string, unknown>, explicit?: string): string | undefined {
  if (explicit) return explicit;
  if (!metadata) return undefined;
  const link = metadata.link ?? metadata.actionUrl ?? metadata.href;
  return typeof link === "string" ? link : undefined;
}

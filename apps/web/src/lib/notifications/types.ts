import type { NotificationPriority, NotificationType } from "@prisma/client";

export type NotificationCategory =
  | "orders"
  | "appointments"
  | "social"
  | "messages"
  | "adoption"
  | "campaigns"
  | "products"
  | "services"
  | "security"
  | "system";

export type NotificationFilter = "all" | NotificationCategory | NotificationType;

export interface NotificationAction {
  label: string;
  href: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  priority: NotificationPriority;
  action?: NotificationAction;
  actionUrl?: string | null;
  meta?: Record<string, unknown>;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  marketingEnabled: boolean;
  orderUpdates: boolean;
  appointmentUpdates: boolean;
  socialUpdates: boolean;
  adoptionUpdates: boolean;
  campaignUpdates: boolean;
  productUpdates: boolean;
  serviceUpdates: boolean;
  securityUpdates: boolean;
}

export interface ChannelStatus {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface AiSummaryInsight {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
}

export interface AiSummary {
  headline: string;
  insights: AiSummaryInsight[];
  generatedAt: string;
  demo?: boolean;
}

export function typeToCategory(type: NotificationType): NotificationCategory {
  switch (type) {
    case "ORDER":
    case "PAYMENT":
      return "orders";
    case "APPOINTMENT":
      return "appointments";
    case "SOCIAL":
      return "social";
    case "MESSAGE":
      return "messages";
    case "ADOPTION":
      return "adoption";
    case "CAMPAIGN":
      return "campaigns";
    case "PRODUCT":
    case "REVIEW":
      return "products";
    case "SERVICE":
      return "services";
    case "SECURITY":
      return "security";
    default:
      return "system";
  }
}

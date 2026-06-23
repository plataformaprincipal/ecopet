import {
  ShoppingBag,
  Calendar,
  Users,
  MessageSquare,
  Heart,
  Megaphone,
  Package,
  Wrench,
  Shield,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { NotificationCategory, NotificationFilter } from "./types";
import type { NotificationType } from "@prisma/client";

export interface CategoryConfig {
  id: NotificationCategory;
  labelKey: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export const NOTIFICATION_CATEGORIES: CategoryConfig[] = [
  { id: "orders", labelKey: "notifications.categories.orders", icon: ShoppingBag, color: "text-ecopet-green", bg: "bg-ecopet-green/10", border: "border-ecopet-green/20" },
  { id: "appointments", labelKey: "notifications.categories.appointments", icon: Calendar, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "social", labelKey: "notifications.categories.social", icon: Users, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  { id: "messages", labelKey: "notifications.categories.messages", icon: MessageSquare, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { id: "adoption", labelKey: "notifications.categories.adoption", icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "campaigns", labelKey: "notifications.categories.campaigns", icon: Megaphone, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "products", labelKey: "notifications.categories.products", icon: Package, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  { id: "services", labelKey: "notifications.categories.services", icon: Wrench, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { id: "security", labelKey: "notifications.categories.security", icon: Shield, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  { id: "system", labelKey: "notifications.categories.system", icon: Bell, color: "text-ecopet-gray dark:text-white/70", bg: "bg-ecopet-gray/10", border: "border-ecopet-gray/20" },
];

export const FILTER_OPTIONS: { id: NotificationFilter; labelKey: string }[] = [
  { id: "all", labelKey: "notifications.filters.all" },
  ...NOTIFICATION_CATEGORIES.map((c) => ({ id: c.id as NotificationFilter, labelKey: c.labelKey })),
];

export function getCategoryConfig(category: NotificationCategory): CategoryConfig {
  return NOTIFICATION_CATEGORIES.find((c) => c.id === category) ?? NOTIFICATION_CATEGORIES[NOTIFICATION_CATEGORIES.length - 1];
}

export function getPriorityStyles(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "LOW":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-ecopet-green/10 text-ecopet-green border-ecopet-green/20";
  }
}

export function formatNotificationTime(iso: string, locale = "pt-BR"): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return locale.startsWith("en") ? "Now" : locale.startsWith("es") ? "Ahora" : "Agora";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return locale.startsWith("en") ? "Yesterday" : locale.startsWith("es") ? "Ayer" : "Ontem";
  if (diffDays < 7) return `${diffDays} ${locale.startsWith("en") ? "days" : "dias"}`;
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

export function formatNotificationDateTime(iso: string, locale = "pt-BR"): string {
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const TYPE_LABEL_KEYS: Record<NotificationType, string> = {
  SYSTEM: "notifications.types.SYSTEM",
  SECURITY: "notifications.types.SECURITY",
  ORDER: "notifications.types.ORDER",
  APPOINTMENT: "notifications.types.APPOINTMENT",
  PRODUCT: "notifications.types.PRODUCT",
  SERVICE: "notifications.types.SERVICE",
  SOCIAL: "notifications.types.SOCIAL",
  MESSAGE: "notifications.types.MESSAGE",
  ADOPTION: "notifications.types.ADOPTION",
  CAMPAIGN: "notifications.types.CAMPAIGN",
  DOCUMENT: "notifications.types.DOCUMENT",
  PAYMENT: "notifications.types.PAYMENT",
  REVIEW: "notifications.types.REVIEW",
  SUPPORT: "notifications.types.SUPPORT",
};

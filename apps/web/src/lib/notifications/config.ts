import {
  Sparkles,
  HeartPulse,
  ShoppingBag,
  Wrench,
  Users,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { NotificationCategory, NotificationFilter } from "./types";

export interface CategoryConfig {
  id: NotificationCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export const NOTIFICATION_CATEGORIES: CategoryConfig[] = [
  {
    id: "ai",
    label: "IA",
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    id: "health",
    label: "Saúde",
    icon: HeartPulse,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    color: "text-ecopet-green",
    bg: "bg-ecopet-green/10",
    border: "border-ecopet-green/20",
  },
  {
    id: "services",
    label: "Serviços",
    icon: Wrench,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    id: "social",
    label: "Social",
    icon: Users,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    id: "system",
    label: "Sistema",
    icon: Shield,
    color: "text-ecopet-gray dark:text-white/70",
    bg: "bg-ecopet-gray/10",
    border: "border-ecopet-gray/20",
  },
];

export const FILTER_OPTIONS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  ...NOTIFICATION_CATEGORIES.map((c) => ({ id: c.id as NotificationFilter, label: c.label })),
];

export function getCategoryConfig(category: NotificationCategory): CategoryConfig {
  return NOTIFICATION_CATEGORIES.find((c) => c.id === category)!;
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatNotificationDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type NotificationCategory =
  | "ai"
  | "health"
  | "marketplace"
  | "services"
  | "social"
  | "system";

export type NotificationFilter = "all" | NotificationCategory;

export interface NotificationAction {
  label: string;
  href: string;
}

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  action?: NotificationAction;
  /** Metadados opcionais para futura integração (petId, orderId, etc.) */
  meta?: Record<string, string>;
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
}

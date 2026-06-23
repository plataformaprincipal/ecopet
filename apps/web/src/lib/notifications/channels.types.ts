export type NotificationChannel = "inApp" | "email" | "sms" | "whatsapp" | "push";

export type ChannelDispatchResult = {
  channel: NotificationChannel;
  delivered: boolean;
  skipped?: boolean;
  reason?: string;
};

export interface NotificationChannelProvider {
  readonly channel: NotificationChannel;
  isConfigured(): Promise<boolean>;
  send(params: {
    userId: string;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ChannelDispatchResult>;
}

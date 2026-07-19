/** Tipos públicos e compartilháveis (sem segredos). */

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export type PushPermissionState =
  | "DEFAULT"
  | "REQUESTING"
  | "GRANTED"
  | "DENIED"
  | "UNSUPPORTED"
  | "ERROR"
  | "TOKEN_REGISTERED"
  | "TOKEN_FAILED";

export type PushCategory =
  | "orders"
  | "payments"
  | "deliveries"
  | "messages"
  | "appointments"
  | "social"
  | "support"
  | "marketing"
  | "security"
  | "admin";

export type SafePushUrl =
  | `/client/${string}`
  | `/partner/${string}`
  | `/ngo/${string}`
  | `/ong/${string}`
  | `/admin/${string}`
  | `/notifications`
  | `/notificacoes`
  | `/mensagens`
  | `/messages`
  | `/agenda`
  | `/pedidos/${string}`
  | `/${string}`;

export type FcmNotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  url?: string;
  locale?: string;
  notificationId?: string;
  category?: PushCategory;
};

export type SendPushSummary = {
  attempted: number;
  sent: number;
  failed: number;
  invalidTokens: number;
  skipped: number;
  retryPending: number;
};

export type PushDevicePublicStatus = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  configured: boolean;
  activeOnThisDevice: boolean;
  deviceId: string | null;
  lastSyncedAt: string | null;
  activeDeviceCount: number;
};

export type FirebaseAdminSanitizedStatus = {
  configured: boolean;
  projectIdConfigured: boolean;
  clientEmailConfigured: boolean;
  privateKeyConfigured: boolean;
  vapidConfigured: boolean;
  publicConfigConfigured: boolean;
  projectIdMasked: string | null;
  environment: "development" | "preview" | "production" | "test" | "unknown";
  status: "READY" | "PARTIAL" | "MISSING" | "DISABLED";
  sanitizedMessage?: string;
};

export type IntegrationStatus = "connected" | "disconnected" | "pending" | "error";

export type RiskLevel = "low" | "medium" | "high";

export type RobotStatus = "active" | "paused" | "error" | "awaiting_config";

export type AutonomyLevel =
  | "monitoring"
  | "suggestion"
  | "approval_required"
  | "auto_limited"
  | "auto_full";

export type LogEventType =
  | "success"
  | "alert"
  | "error"
  | "auto_action"
  | "pending"
  | "human_review";

export type IntegrationCategory =
  | "social"
  | "whatsapp"
  | "sites"
  | "marketplaces"
  | "payments"
  | "erp"
  | "crm"
  | "agenda"
  | "email"
  | "sms"
  | "storage"
  | "bi"
  | "ai"
  | "iot"
  | "robots"
  | "agropet"
  | "health"
  | "financial"
  | "legal"
  | "accounting"
  | "marketing";

export interface ExternalIntegration {
  id: string;
  name: string;
  provider: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  lastSync?: string;
  permissions: string[];
  syncedData: string[];
  responsible: string;
  riskLevel: RiskLevel;
  eventsCount?: number;
}

export interface InternalIntegration {
  id: string;
  origin: string;
  destination: string;
  sharedData: string[];
  status: IntegrationStatus;
  activeAutomations: number;
  riskLevel: RiskLevel;
  permissions: string[];
}

export interface Robot24h {
  id: string;
  name: string;
  function: string;
  area: string;
  status: RobotStatus;
  frequency: string;
  lastRun: string;
  nextRun: string;
  alerts: number;
  actionsExecuted: number;
  autonomy: AutonomyLevel;
  operationalRisk: RiskLevel;
  aiRecommendation?: string;
}

export interface AutomationLog {
  id: string;
  date: string;
  time: string;
  module: string;
  robot?: string;
  integration?: string;
  event: string;
  status: LogEventType;
  actionTaken: string;
  recommendation?: string;
  riskLevel: RiskLevel;
}

export interface IntegrationDashboardStats {
  activeIntegrations: number;
  errorIntegrations: number;
  activeRobots: number;
  criticalAlerts: number;
  runningAutomations: number;
  lastSync: string;
  dataProcessed: string;
  risksFound: number;
}

export interface IntegrationAIInsight {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  action?: string;
}

export type ProfileCategory = "CLIENT" | "PARTNER" | "NGO";

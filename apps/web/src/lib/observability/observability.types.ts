export type ObservabilityStatus = "NOT_CONFIGURED" | "ACTIVE" | "ERROR";

export type ObservabilityProvider = {
  id: string;
  name: string;
  status: ObservabilityStatus;
  requiredEnvVars: string[];
  description: string;
};

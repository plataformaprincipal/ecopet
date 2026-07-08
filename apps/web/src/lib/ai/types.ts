import type { UserRole } from "@prisma/client";

export type AiModelProvider = "openai" | "anthropic" | "google";
export type AiEntityStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export type AiAgentId =
  | "client"
  | "partner"
  | "ngo"
  | "admin"
  | "marketplace"
  | "veterinarian"
  | "pet"
  | "marketing"
  | "finance"
  | "legal"
  | "commercial"
  | "support"
  | "analytics";

export type AiMemoryScope = "user" | "pet" | "partner" | "ngo" | "admin";

export type AiIntegrationPointId =
  | "dashboard"
  | "marketplace"
  | "pet"
  | "agenda"
  | "chat"
  | "social"
  | "profile"
  | "partner"
  | "ngo"
  | "admin";

export type AiModelConfig = {
  id: string;
  provider: AiModelProvider;
  label: string;
  description: string;
  version: string;
  contextWindow: number;
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
  maxTokens: number;
  inputCostPer1kUsd: number;
  outputCostPer1kUsd: number;
  enabled: boolean;
  status: AiEntityStatus;
};

export type AiAgentDefinition = {
  id: AiAgentId;
  name: string;
  description: string;
  allowedRoles: readonly UserRole[];
  defaultModelId: string;
  temperature: number;
  promptKey: string;
  promptVersion: string;
  memoryScopes: readonly AiMemoryScope[];
  toolIds: readonly string[];
  integrationPoints: readonly AiIntegrationPointId[];
  status: AiEntityStatus;
};

export type AiPromptDefinition = {
  id: string;
  key: string;
  name: string;
  category: string;
  version: string;
  content: string;
  recommendedModel: string;
  temperature: number;
  isActive: boolean;
  agentId: AiAgentId;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AiToolDefinition = {
  id: string;
  name: string;
  description: string;
  agentIds: readonly AiAgentId[];
  requiredRoles: readonly UserRole[];
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  status: AiEntityStatus;
};

export type AiMemoryEntry = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type AiMemoryContext = {
  scope: AiMemoryScope;
  ownerId: string;
  petId?: string;
  summary: string;
  history: AiMemoryEntry[];
  preferences: Record<string, unknown>;
  lastConversation: string | null;
  lastQuestions: string[];
  lastCommands: string[];
  lastResults: string[];
};

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiGenerateInput = {
  model: string;
  messages: AiChatMessage[];
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, string>;
};

export type AiCompletionUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AiGenerateResult = {
  provider: string;
  model: string;
  content: string;
  usage: AiCompletionUsage;
};

export type AiStreamChunk = {
  delta: string;
  done?: boolean;
};

export type AiEmbedInput = { texts: string[]; model?: string };
export type AiEmbedResult = { vectors: number[][]; model: string; dimensions: number };

export type AiModerateInput = { text: string };
export type AiModerateResult = { allowed: boolean; categories: string[]; reason?: string };

export type AiModelInfo = {
  id: string;
  provider: string;
  name: string;
  version?: string;
  contextWindow: number;
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
  status: AiEntityStatus;
};

export type AiHealthCheckResult = {
  ok: boolean;
  provider: string;
  message?: string;
  latencyMs?: number;
};

export type OrchestratorRequest = {
  userId: string;
  role: UserRole;
  message: string;
  agentId?: AiAgentId;
  petId?: string;
  partnerId?: string;
  ngoId?: string;
  integrationPoint?: AiIntegrationPointId;
  metadata?: Record<string, unknown>;
};

export type OrchestratorResponse = {
  success: boolean;
  agentId: AiAgentId;
  model: string;
  provider: AiModelProvider;
  content: string | null;
  promptVersion: string;
  error?: { code: string; message: string };
  usage?: AiCompletionUsage;
  durationMs: number;
  estimatedCostUsd: number;
  sessionId?: string;
  conversationId?: string;
};

export type AiLogRecord = {
  userId: string;
  agentId: AiAgentId;
  model: string;
  provider: AiModelProvider;
  prompt: string;
  response: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  estimatedCostUsd: number;
  errorCode?: string;
  errorMessage?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
};

export type AiTokenUsageRecord = {
  userId: string;
  model: string;
  provider: AiModelProvider;
  project?: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCost: number;
};

export type AiProviderDefinition = {
  code: AiModelProvider;
  name: string;
  status: AiEntityStatus;
  isConfigured: boolean;
};

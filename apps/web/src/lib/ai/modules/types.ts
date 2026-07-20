import type { UserRole } from "@prisma/client";
import type { AiLocale, AiModule } from "@/lib/ai/ai-config";
import type { AssistantPersona } from "@/lib/ai/assistant/types";

/** Módulos de negócio conhecidos pela camada aplicada. */
export type BusinessModule =
  | "marketplace"
  | "mypet"
  | "agenda"
  | "partners"
  | "ngo"
  | "social"
  | "profile"
  | "notifications"
  | "maps"
  | "admin"
  | "orders"
  | "cart"
  | "support"
  | "general";

export type BusinessToolName =
  | "consult_products"
  | "consult_services"
  | "consult_cart"
  | "consult_orders"
  | "consult_pets"
  | "consult_agenda"
  | "consult_profile"
  | "consult_notifications"
  | "consult_partner_summary"
  | "consult_ngo_summary"
  | "consult_social"
  | "consult_partners_public";

export type JsonSchemaProperty = {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  enum?: string[];
};

export type BusinessToolDefinition = {
  name: BusinessToolName;
  description: string;
  modules: BusinessModule[];
  /** Personas que podem usar a ferramenta. */
  personas: AssistantPersona[];
  /** Roles Prisma permitidos. */
  roles: UserRole[];
  readOnly: boolean;
  parameters: {
    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
};

export type ToolExecutionContext = {
  userId: string;
  role: UserRole;
  persona: AssistantPersona;
  locale: AiLocale;
  confirmed?: boolean;
};

export type ToolExecutionResult = {
  toolName: BusinessToolName;
  executed: boolean;
  ok: boolean;
  requiresConfirmation?: boolean;
  error?: string;
  data: unknown;
  latencyMs: number;
};

export type BusinessContextInput = {
  userId: string;
  role: UserRole;
  persona: AssistantPersona;
  locale: AiLocale;
  message: string;
  module?: AiModule | BusinessModule;
  pagePath?: string;
  petId?: string;
  conversationId?: string;
  displayName?: string | null;
};

export type BusinessContext = {
  persona: AssistantPersona;
  locale: AiLocale;
  activeModule: BusinessModule;
  pagePath?: string;
  systemPrompt: string;
  contextBlock: string;
  toolResults: ToolExecutionResult[];
  toolsUsed: BusinessToolName[];
  memorySummary: string;
  disclaimer: string;
  estimatedTokens: number;
};

export type OpenAiToolSchema = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: BusinessToolDefinition["parameters"];
  };
};

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
  | "loyalty"
  | "adoption"
  | "vaccination"
  | "accessibility"
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
  | "consult_partners_public"
  | "consult_adoptions"
  | "consult_loyalty"
  | "consult_trending"
  | "consult_pet_vaccinations"
  | "request_client_action"
  | "add_to_cart"
  | "create_support_ticket"
  | "prepare_appointment"
  | "generate_image";

export type ClientActionName =
  | "SET_THEME"
  | "SET_FONT_SCALE"
  | "ENABLE_SIMPLE_LANGUAGE"
  | "ENABLE_SIMPLIFIED_UI"
  | "ENABLE_STRONG_FOCUS"
  | "OPEN_ACCESSIBILITY"
  | "OPEN_CART"
  | "NAVIGATE"
  | "OPEN_ADOPTION_FILTERS"
  | "OPEN_MARKETPLACE_FILTERS"
  | "REQUEST_GEOLOCATION";

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
  /** Coordenadas temporárias enviadas pelo cliente após consentimento explícito. */
  lat?: number;
  lng?: number;
  /** Allowlist da capability ativa — se definida, tools fora dela são negadas. */
  allowedTools?: string[];
  capabilityId?: string;
};

export type ToolExecutionResult = {
  toolName: BusinessToolName;
  executed: boolean;
  ok: boolean;
  requiresConfirmation?: boolean;
  /** Parâmetros validados — presentes quando a execução aguarda confirmação. */
  params?: Record<string, unknown>;
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
  lat?: number;
  lng?: number;
  allowedTools?: string[];
  capabilityId?: string;
  capabilityPrompt?: string;
  capabilityModule?: string;
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

/**
 * Capabilities EccoPet AI — orquestração sobre provider OpenAI existente.
 */

import { REGISTERED_AI_TOOL_NAMES } from "./tool-names";

export type CapabilityAudience = "B2C" | "B2B" | "PLATFORM" | "CLINICAL" | "GUEST";

export type CapabilityIconKey =
  | "compass"
  | "stethoscope"
  | "shopping-bag"
  | "calendar-days"
  | "map-pin"
  | "plane"
  | "heart"
  | "pen-line"
  | "message-circle"
  | "users"
  | "package"
  | "tag"
  | "warehouse"
  | "calendar-clock"
  | "wallet"
  | "megaphone"
  | "headset"
  | "shield-check";

export type CapabilityRequirements = {
  login?: boolean;
  pet?: boolean;
  location?: boolean;
  partner?: boolean;
  featureFlag?: string;
};

export type AiCapabilityDefinition = {
  id: string;
  icon: CapabilityIconKey;
  nameKey: string;
  descriptionKey: string;
  exampleKeys: string[];
  defaultPromptKey: string;
  audience: CapabilityAudience;
  intents: string[];
  tools: string[];
  requirements: CapabilityRequirements;
  requiresConfirmation?: boolean;
  /** Capabilities sem backend dedicado — apenas orientação via chat genérico */
  informationalOnly?: boolean;
  limits?: { maxToolsPerTurn?: number; timeoutMs?: number };
  safetyRules: string[];
  module?: string;
};

export type CapabilityAvailabilityState = "available" | "locked" | "disabled" | "partial";

export type ResolvedCapability = AiCapabilityDefinition & {
  availability: CapabilityAvailabilityState;
  lockReason?: "login" | "pet" | "partner" | "location";
  disabledReasonKey?: string;
};

export type CapabilityUserContext = {
  isGuest: boolean;
  isPartner: boolean;
  isOng: boolean;
  isAdmin: boolean;
  hasPet: boolean;
  hasGeo: boolean;
  aiConfigured: boolean;
  featureFlags?: Record<string, boolean>;
};

function toolsAvailable(tools: string[]): boolean {
  if (!tools.length) return false;
  return tools.some((t) => REGISTERED_AI_TOOL_NAMES.has(t));
}

export function resolveCapabilityAvailability(
  cap: AiCapabilityDefinition,
  ctx: CapabilityUserContext
): ResolvedCapability {
  const base = { ...cap, availability: "available" as CapabilityAvailabilityState };

  if (!ctx.aiConfigured) {
    return { ...base, availability: "disabled", disabledReasonKey: "ecopetAi.capabilities.unavailableAi" };
  }

  if (cap.requirements.partner && !ctx.isPartner) {
    return { ...base, availability: "locked", lockReason: "partner" };
  }

  if (cap.requirements.login && ctx.isGuest) {
    return { ...base, availability: "locked", lockReason: "login" };
  }

  if (cap.requirements.pet && !ctx.hasPet) {
    return { ...base, availability: "locked", lockReason: "pet" };
  }

  if (cap.requirements.featureFlag) {
    const enabled = ctx.featureFlags?.[cap.requirements.featureFlag];
    if (!enabled) {
      return {
        ...base,
        availability: "disabled",
        disabledReasonKey: "ecopetAi.capabilities.featureFlag",
      };
    }
  }

  if (cap.informationalOnly) {
    return { ...base, availability: "partial", disabledReasonKey: "ecopetAi.capabilities.informationalOnly" };
  }

  if (cap.tools.length && !toolsAvailable(cap.tools)) {
    return {
      ...base,
      availability: "disabled",
      disabledReasonKey: "ecopetAi.capabilities.noBackend",
    };
  }

  if (cap.audience === "B2B" && cap.tools.length === 0) {
    return {
      ...base,
      availability: "disabled",
      disabledReasonKey: "ecopetAi.capabilities.noBackend",
    };
  }

  return base;
}

export const B2C_CAPABILITIES: AiCapabilityDefinition[] = [
  {
    id: "concierge",
    icon: "compass",
    nameKey: "ecopetAi.capabilities.concierge.name",
    descriptionKey: "ecopetAi.capabilities.concierge.description",
    exampleKeys: ["ecopetAi.capabilities.concierge.ex1", "ecopetAi.capabilities.concierge.ex2"],
    defaultPromptKey: "ecopetAi.capabilities.concierge.prompt",
    audience: "B2C",
    intents: ["search", "navigate", "orders", "cart", "schedule"],
    tools: ["consult_products", "consult_services", "consult_cart", "consult_orders", "consult_agenda", "request_client_action"],
    requirements: {},
    safetyRules: ["Não execute compra, cancelamento ou exclusão sem confirmação explícita."],
    module: "assistant",
  },
  {
    id: "care_navigator",
    icon: "stethoscope",
    nameKey: "ecopetAi.capabilities.care_navigator.name",
    descriptionKey: "ecopetAi.capabilities.care_navigator.description",
    exampleKeys: ["ecopetAi.capabilities.care_navigator.ex1", "ecopetAi.capabilities.care_navigator.ex2"],
    defaultPromptKey: "ecopetAi.capabilities.care_navigator.prompt",
    audience: "B2C",
    intents: ["health_org", "vaccine_reminder", "vet_prep"],
    tools: ["consult_pet_vaccinations", "consult_pets", "consult_agenda"],
    requirements: { login: true, pet: true },
    safetyRules: [
      "Não diagnostique, não prescreva e não defina dose.",
      "Encaminhe a um médico-veterinário quando houver sinal de alerta.",
    ],
    module: "pets",
  },
  {
    id: "shopping_agent",
    icon: "shopping-bag",
    nameKey: "ecopetAi.capabilities.shopping_agent.name",
    descriptionKey: "ecopetAi.capabilities.shopping_agent.description",
    exampleKeys: ["ecopetAi.capabilities.shopping_agent.ex1", "ecopetAi.capabilities.shopping_agent.ex2"],
    defaultPromptKey: "ecopetAi.capabilities.shopping_agent.prompt",
    audience: "B2C",
    intents: ["buy", "compare", "recommend_product"],
    tools: ["consult_products", "add_to_cart", "consult_cart"],
    requirements: {},
    safetyRules: ["Não invente preço, estoque, frete ou avaliação.", "add_to_cart exige confirmação."],
    module: "marketplace",
  },
  {
    id: "routine_coach",
    icon: "calendar-days",
    nameKey: "ecopetAi.capabilities.routine_coach.name",
    descriptionKey: "ecopetAi.capabilities.routine_coach.description",
    exampleKeys: ["ecopetAi.capabilities.routine_coach.ex1", "ecopetAi.capabilities.routine_coach.ex2"],
    defaultPromptKey: "ecopetAi.capabilities.routine_coach.prompt",
    audience: "B2C",
    intents: ["routine", "reminder", "activity"],
    tools: ["consult_agenda", "consult_pets"],
    requirements: { login: true },
    safetyRules: ["Não prescreva alimentação clínica nem tratamento."],
    module: "assistant",
  },
  {
    id: "lost_pet",
    icon: "map-pin",
    nameKey: "ecopetAi.capabilities.lost_pet.name",
    descriptionKey: "ecopetAi.capabilities.lost_pet.description",
    exampleKeys: ["ecopetAi.capabilities.lost_pet.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.lost_pet.prompt",
    audience: "B2C",
    intents: ["report_lost", "search_nearby"],
    tools: ["consult_pets", "request_client_action"],
    requirements: { login: true },
    informationalOnly: true,
    safetyRules: ["Não invente GPS nem localização precisa do animal.", "Publicação na comunidade exige confirmação do usuário."],
    module: "pets",
  },
  {
    id: "travel_agent",
    icon: "plane",
    nameKey: "ecopetAi.capabilities.travel_agent.name",
    descriptionKey: "ecopetAi.capabilities.travel_agent.description",
    exampleKeys: ["ecopetAi.capabilities.travel_agent.ex1", "ecopetAi.capabilities.travel_agent.ex2"],
    defaultPromptKey: "ecopetAi.capabilities.travel_agent.prompt",
    audience: "B2C",
    intents: ["travel_checklist", "documents"],
    tools: ["consult_services", "request_client_action"],
    requirements: {},
    safetyRules: ["Não invente regra sanitária, alfândega, companhia aérea, preço ou disponibilidade."],
    module: "assistant",
  },
  {
    id: "adoption_assistant",
    icon: "heart",
    nameKey: "ecopetAi.capabilities.adoption_assistant.name",
    descriptionKey: "ecopetAi.capabilities.adoption_assistant.description",
    exampleKeys: ["ecopetAi.capabilities.adoption_assistant.ex1", "ecopetAi.capabilities.adoption_assistant.ex2"],
    defaultPromptKey: "ecopetAi.capabilities.adoption_assistant.prompt",
    audience: "B2C",
    intents: ["adopt_filter", "compatibility"],
    tools: ["consult_adoptions", "request_client_action"],
    requirements: {},
    safetyRules: ["Use apenas listagens reais. Oriente adoção responsável."],
    module: "ong",
  },
  {
    id: "content_studio",
    icon: "pen-line",
    nameKey: "ecopetAi.capabilities.content_studio.name",
    descriptionKey: "ecopetAi.capabilities.content_studio.description",
    exampleKeys: ["ecopetAi.capabilities.content_studio.ex1", "ecopetAi.capabilities.content_studio.ex2"],
    defaultPromptKey: "ecopetAi.capabilities.content_studio.prompt",
    audience: "B2C",
    intents: ["caption", "translate", "pet_bio"],
    tools: ["request_client_action"],
    requirements: { login: true },
    safetyRules: ["Não publique automaticamente.", "Não use histórico médico em legendas."],
    module: "social",
  },
];

export const B2B_CAPABILITIES: AiCapabilityDefinition[] = [
  {
    id: "sales_agent",
    icon: "message-circle",
    nameKey: "ecopetAi.capabilities.sales_agent.name",
    descriptionKey: "ecopetAi.capabilities.sales_agent.description",
    exampleKeys: ["ecopetAi.capabilities.sales_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.sales_agent.prompt",
    audience: "B2B",
    intents: ["reply", "recommend"],
    tools: ["consult_products", "consult_orders"],
    requirements: { partner: true, login: true },
    safetyRules: [],
    module: "partner",
  },
  {
    id: "crm_agent",
    icon: "users",
    nameKey: "ecopetAi.capabilities.crm_agent.name",
    descriptionKey: "ecopetAi.capabilities.crm_agent.description",
    exampleKeys: ["ecopetAi.capabilities.crm_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.crm_agent.prompt",
    audience: "B2B",
    intents: ["segment", "reactivate"],
    tools: ["consult_partner_summary"],
    requirements: { partner: true, login: true },
    safetyRules: [],
    module: "partner",
  },
  {
    id: "catalog_agent",
    icon: "package",
    nameKey: "ecopetAi.capabilities.catalog_agent.name",
    descriptionKey: "ecopetAi.capabilities.catalog_agent.description",
    exampleKeys: ["ecopetAi.capabilities.catalog_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.catalog_agent.prompt",
    audience: "B2B",
    intents: ["catalog"],
    tools: ["consult_products"],
    requirements: { partner: true, login: true },
    safetyRules: [],
    module: "partner",
  },
  {
    id: "pricing_agent",
    icon: "tag",
    nameKey: "ecopetAi.capabilities.pricing_agent.name",
    descriptionKey: "ecopetAi.capabilities.pricing_agent.description",
    exampleKeys: ["ecopetAi.capabilities.pricing_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.pricing_agent.prompt",
    audience: "B2B",
    intents: ["price_suggest"],
    tools: [],
    requirements: { partner: true, login: true },
    requiresConfirmation: true,
    safetyRules: [],
    module: "partner",
  },
  {
    id: "inventory_agent",
    icon: "warehouse",
    nameKey: "ecopetAi.capabilities.inventory_agent.name",
    descriptionKey: "ecopetAi.capabilities.inventory_agent.description",
    exampleKeys: ["ecopetAi.capabilities.inventory_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.inventory_agent.prompt",
    audience: "B2B",
    intents: ["stock"],
    tools: ["consult_products"],
    requirements: { partner: true, login: true },
    safetyRules: [],
    module: "partner",
  },
  {
    id: "service_capacity_agent",
    icon: "calendar-clock",
    nameKey: "ecopetAi.capabilities.service_capacity_agent.name",
    descriptionKey: "ecopetAi.capabilities.service_capacity_agent.description",
    exampleKeys: ["ecopetAi.capabilities.service_capacity_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.service_capacity_agent.prompt",
    audience: "B2B",
    intents: ["capacity"],
    tools: ["consult_agenda"],
    requirements: { partner: true, login: true },
    safetyRules: [],
    module: "partner",
  },
  {
    id: "finance_agent",
    icon: "wallet",
    nameKey: "ecopetAi.capabilities.finance_agent.name",
    descriptionKey: "ecopetAi.capabilities.finance_agent.description",
    exampleKeys: ["ecopetAi.capabilities.finance_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.finance_agent.prompt",
    audience: "B2B",
    intents: ["reconcile"],
    tools: [],
    requirements: { partner: true, login: true },
    requiresConfirmation: true,
    safetyRules: [],
    module: "partner",
  },
  {
    id: "ads_copilot",
    icon: "megaphone",
    nameKey: "ecopetAi.capabilities.ads_copilot.name",
    descriptionKey: "ecopetAi.capabilities.ads_copilot.description",
    exampleKeys: ["ecopetAi.capabilities.ads_copilot.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.ads_copilot.prompt",
    audience: "B2B",
    intents: ["campaign"],
    tools: [],
    requirements: { partner: true, login: true, featureFlag: "ads_copilot" },
    safetyRules: [],
    module: "partner",
  },
  {
    id: "support_agent_b2b",
    icon: "headset",
    nameKey: "ecopetAi.capabilities.support_agent_b2b.name",
    descriptionKey: "ecopetAi.capabilities.support_agent_b2b.description",
    exampleKeys: ["ecopetAi.capabilities.support_agent_b2b.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.support_agent_b2b.prompt",
    audience: "B2B",
    intents: ["partner_help"],
    tools: ["create_support_ticket"],
    requirements: { partner: true, login: true },
    safetyRules: [],
    module: "support",
  },
  {
    id: "compliance_agent",
    icon: "shield-check",
    nameKey: "ecopetAi.capabilities.compliance_agent.name",
    descriptionKey: "ecopetAi.capabilities.compliance_agent.description",
    exampleKeys: ["ecopetAi.capabilities.compliance_agent.ex1"],
    defaultPromptKey: "ecopetAi.capabilities.compliance_agent.prompt",
    audience: "B2B",
    intents: ["kyc"],
    tools: [],
    requirements: { partner: true, login: true },
    safetyRules: [],
    module: "partner",
  },
];

export const ALL_CAPABILITIES: AiCapabilityDefinition[] = [...B2C_CAPABILITIES, ...B2B_CAPABILITIES];

const byId = new Map(ALL_CAPABILITIES.map((c) => [c.id, c]));

export function getCapability(id: string): AiCapabilityDefinition | undefined {
  return byId.get(id);
}

export function resolveCapabilitiesForUser(ctx: CapabilityUserContext): {
  b2c: ResolvedCapability[];
  b2b: ResolvedCapability[];
} {
  return {
    b2c: B2C_CAPABILITIES.map((c) => resolveCapabilityAvailability(c, ctx)),
    b2b: ctx.isPartner ? B2B_CAPABILITIES.map((c) => resolveCapabilityAvailability(c, ctx)) : [],
  };
}

export function getQuickPrompts(ctx: {
  isGuest: boolean;
  isPartner: boolean;
}): string[] {
  if (ctx.isPartner) {
    return [
      "ecopetAi.quickPrompts.partner.orders",
      "ecopetAi.quickPrompts.partner.reactivate",
      "ecopetAi.quickPrompts.partner.catalog",
      "ecopetAi.quickPrompts.partner.schedule",
    ];
  }
  if (ctx.isGuest) {
    return [
      "ecopetAi.quickPrompts.guest.near",
      "ecopetAi.quickPrompts.guest.marketplace",
      "ecopetAi.quickPrompts.guest.about",
      "ecopetAi.quickPrompts.guest.adoption",
    ];
  }
  return [
    "ecopetAi.quickPrompts.auth.orders",
    "ecopetAi.quickPrompts.auth.vaccines",
    "ecopetAi.quickPrompts.auth.near",
    "ecopetAi.quickPrompts.auth.reorder",
  ];
}

export function statusPhaseLabelKey(phase: string): string {
  const map: Record<string, string> = {
    context: "ecopetAi.status.context",
    tools: "ecopetAi.status.tools",
    generating: "ecopetAi.status.generating",
    summary: "ecopetAi.status.summary",
    routing: "ecopetAi.status.routing",
    received: "ecopetAi.status.received",
  };
  return map[phase] ?? "ecopetAi.status.generating";
}

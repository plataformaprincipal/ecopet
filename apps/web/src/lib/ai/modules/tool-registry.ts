import { UserRole } from "@prisma/client";
import type {
  BusinessToolDefinition,
  BusinessToolName,
  OpenAiToolSchema,
} from "./types";
import { filterToolsForRole } from "./permission-checker";

const CLIENT = [UserRole.CLIENT, UserRole.TUTOR] as const;
const PARTNER = [UserRole.PARTNER] as const;
const ONG = [UserRole.ONG] as const;
const ADMIN = [UserRole.ADMIN] as const;
const ALL = [...CLIENT, ...PARTNER, ...ONG, ...ADMIN] as const;

const registry = new Map<BusinessToolName, BusinessToolDefinition>();

function def(tool: BusinessToolDefinition) {
  registry.set(tool.name, tool);
}

function bootstrap() {
  if (registry.size) return;

  def({
    name: "consult_products",
    description: "Consulta produtos públicos do Marketplace EcoPet.",
    modules: ["marketplace"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Termo de busca" },
        lat: { type: "number", description: "Latitude (somente se o usuário consentiu)" },
        lng: { type: "number", description: "Longitude (somente se o usuário consentiu)" },
      },
      required: [],
    },
  });

  def({
    name: "consult_services",
    description: "Consulta serviços públicos do Marketplace.",
    modules: ["marketplace", "agenda"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Termo de busca" },
        lat: { type: "number", description: "Latitude (somente se o usuário consentiu)" },
        lng: { type: "number", description: "Longitude (somente se o usuário consentiu)" },
      },
    },
  });

  def({
    name: "consult_cart",
    description: "Consulta o carrinho do usuário autenticado.",
    modules: ["cart", "marketplace"],
    personas: ["CLIENT", "ADMIN"],
    roles: [...CLIENT, ...ADMIN],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_orders",
    description: "Lista pedidos do usuário ou consulta um pedido por id.",
    modules: ["orders", "marketplace"],
    personas: ["CLIENT", "PARTNER", "ADMIN"],
    roles: [...CLIENT, ...PARTNER, ...ADMIN],
    readOnly: true,
    parameters: {
      type: "object",
      properties: { orderId: { type: "string", description: "ID opcional do pedido" } },
    },
  });

  def({
    name: "consult_pets",
    description: "Consulta pets, vacinas, medicamentos e lembretes do tutor (Meu Pet).",
    modules: ["mypet"],
    personas: ["CLIENT", "ADMIN"],
    roles: [...CLIENT, ...ADMIN],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_agenda",
    description: "Consulta agendamentos do usuário ou parceiro.",
    modules: ["agenda"],
    personas: ["CLIENT", "PARTNER", "ADMIN"],
    roles: [...CLIENT, ...PARTNER, ...ADMIN],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_profile",
    description: "Consulta perfil mínimo seguro do usuário (sem dados sensíveis).",
    modules: ["profile"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_notifications",
    description: "Consulta notificações recentes e contagem de não lidas.",
    modules: ["notifications"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_partner_summary",
    description: "Resumo operacional do parceiro autenticado.",
    modules: ["partners"],
    personas: ["PARTNER", "ADMIN"],
    roles: [...PARTNER, ...ADMIN],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_ngo_summary",
    description: "Resumo operacional da ONG autenticada.",
    modules: ["ngo"],
    personas: ["ONG", "ADMIN"],
    roles: [...ONG, ...ADMIN],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_social",
    description: "Busca superficial na rede social (hashtags/perfis).",
    modules: ["social"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Termo de busca" } },
      required: ["query"],
    },
  });

  def({
    name: "consult_partners_public",
    description: "Busca parceiros públicos no Marketplace.",
    modules: ["partners", "marketplace", "maps"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Termo de busca" } },
    },
  });

  def({
    name: "consult_adoptions",
    description: "Consulta anúncios públicos de adoção (ONGs aprovadas).",
    modules: ["adoption", "ngo"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome ou termo de busca" },
        species: { type: "string", description: "Espécie (DOG, CAT, etc.)" },
        city: { type: "string", description: "Cidade" },
        state: { type: "string", description: "UF" },
        sex: { type: "string", description: "Sexo" },
        size: { type: "string", description: "Porte" },
        age: { type: "string", description: "Faixa etária: puppy|young|adult|senior" },
      },
    },
  });

  def({
    name: "consult_loyalty",
    description: "Consulta saldo e tier EccoPontos do usuário autenticado.",
    modules: ["loyalty"],
    personas: ["CLIENT", "ADMIN"],
    roles: [...CLIENT, ...ADMIN],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_trending",
    description: "Consulta hashtags e destaques em tendência na plataforma.",
    modules: ["social", "marketplace"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: true,
    parameters: { type: "object", properties: {} },
  });

  def({
    name: "consult_pet_vaccinations",
    description: "Consulta vacinas dos pets do tutor, com status (EM_DIA/PROXIMA/ATRASADA).",
    modules: ["vaccination", "mypet"],
    personas: ["CLIENT", "ADMIN"],
    roles: [...CLIENT, ...ADMIN],
    readOnly: true,
    parameters: {
      type: "object",
      properties: {
        petId: { type: "string", description: "ID opcional do pet" },
        petName: { type: "string", description: "Nome opcional do pet" },
      },
    },
  });

  def({
    name: "request_client_action",
    description:
      "Solicita ação no cliente (tema, acessibilidade, navegação, filtros). Não executa JS no servidor.",
    modules: ["accessibility", "general"],
    personas: ["CLIENT", "PARTNER", "ONG", "ADMIN"],
    roles: [...ALL],
    readOnly: false,
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Ação permitida no frontend",
          enum: [
            "SET_THEME",
            "SET_FONT_SCALE",
            "ENABLE_SIMPLE_LANGUAGE",
            "ENABLE_SIMPLIFIED_UI",
            "ENABLE_STRONG_FOCUS",
            "OPEN_ACCESSIBILITY",
            "OPEN_CART",
            "NAVIGATE",
            "OPEN_ADOPTION_FILTERS",
            "OPEN_MARKETPLACE_FILTERS",
            "REQUEST_GEOLOCATION",
          ],
        },
        payload: { type: "object", description: "Payload estruturado da ação" },
      },
      required: ["action"],
    },
  });

  def({
    name: "add_to_cart",
    description: "Adiciona produto ao carrinho (requer confirmação).",
    modules: ["cart", "marketplace"],
    personas: ["CLIENT", "ADMIN"],
    roles: [...CLIENT, ...ADMIN],
    readOnly: false,
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string", description: "ID do produto" },
        quantity: { type: "number", description: "Quantidade (1–20)" },
      },
      required: ["productId"],
    },
  });

  def({
    name: "create_support_ticket",
    description: "Cria ticket de suporte (requer confirmação).",
    modules: ["support"],
    personas: ["CLIENT", "ADMIN"],
    roles: [...CLIENT, ...ADMIN],
    readOnly: false,
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Assunto" },
        description: { type: "string", description: "Descrição do problema" },
        category: {
          type: "string",
          description: "Categoria",
          enum: [
            "ACCOUNT",
            "ORDER",
            "PAYMENT",
            "PET",
            "PARTNER",
            "ONG",
            "TECHNICAL",
            "OTHER",
          ],
        },
        priority: {
          type: "string",
          description: "Prioridade",
          enum: ["LOW", "NORMAL", "MEDIUM", "HIGH", "URGENT"],
        },
      },
      required: ["subject", "description"],
    },
  });

  def({
    name: "prepare_appointment",
    description:
      "Prepara rascunho de agendamento; só persiste se confirmed=true (requer confirmação).",
    modules: ["agenda"],
    personas: ["CLIENT", "ADMIN"],
    roles: [...CLIENT, ...ADMIN],
    readOnly: false,
    parameters: {
      type: "object",
      properties: {
        petId: { type: "string", description: "ID do pet" },
        serviceId: { type: "string", description: "ID do serviço" },
        startAt: { type: "string", description: "ISO datetime do início" },
        notes: { type: "string", description: "Observações opcionais" },
        attendanceMode: {
          type: "string",
          description: "Modo de atendimento",
          enum: ["IN_PERSON", "TELEBUSCA", "TUTOR_DELIVERY"],
        },
      },
      required: ["petId", "serviceId", "startAt"],
    },
  });
}

bootstrap();

export function getBusinessTool(name: string): BusinessToolDefinition | null {
  return registry.get(name as BusinessToolName) ?? null;
}

export function listBusinessTools(role?: UserRole): BusinessToolDefinition[] {
  const all = [...registry.values()];
  return role ? filterToolsForRole(all, role) : all;
}

export function toOpenAiToolSchemas(role: UserRole, allowedTools?: string[]): OpenAiToolSchema[] {
  const allow = allowedTools ? new Set(allowedTools) : null;
  return listBusinessTools(role)
    .filter((t) => !allow || allow.has(t.name))
    .map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

/** Catálogo estático para admin/diagnóstico. */
export function getToolCatalogSnapshot() {
  return listBusinessTools().map((t) => ({
    name: t.name,
    description: t.description,
    modules: t.modules,
    personas: t.personas,
    readOnly: t.readOnly,
    roles: t.roles,
  }));
}

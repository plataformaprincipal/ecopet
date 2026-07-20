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
      properties: { query: { type: "string", description: "Termo de busca" } },
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
      properties: { query: { type: "string", description: "Termo de busca" } },
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
}

bootstrap();

export function getBusinessTool(name: string): BusinessToolDefinition | null {
  return registry.get(name as BusinessToolName) ?? null;
}

export function listBusinessTools(role?: UserRole): BusinessToolDefinition[] {
  const all = [...registry.values()];
  return role ? filterToolsForRole(all, role) : all;
}

export function toOpenAiToolSchemas(role: UserRole): OpenAiToolSchema[] {
  return listBusinessTools(role).map((t) => ({
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

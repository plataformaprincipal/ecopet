import type { AiIntegrationPointId } from "@/lib/ai/types";

export type AiIntegrationPoint = {
  id: AiIntegrationPointId;
  label: string;
  route: string;
  defaultAgentId: string;
  status: "ready" | "planned";
};

/** Pontos de integração AI-First no ecossistema EcoPet. */
export const AI_INTEGRATION_POINTS: AiIntegrationPoint[] = [
  { id: "dashboard", label: "Dashboard", route: "/cliente", defaultAgentId: "client", status: "ready" },
  { id: "marketplace", label: "Marketplace", route: "/marketplace", defaultAgentId: "marketplace", status: "ready" },
  { id: "pet", label: "Meu Pet", route: "/meu-pet", defaultAgentId: "pet", status: "ready" },
  { id: "agenda", label: "Agenda", route: "/agenda", defaultAgentId: "veterinarian", status: "ready" },
  { id: "chat", label: "Chat", route: "/social/mensagens", defaultAgentId: "support", status: "ready" },
  { id: "social", label: "Feed Social", route: "/social", defaultAgentId: "client", status: "ready" },
  { id: "profile", label: "Perfil", route: "/perfil", defaultAgentId: "client", status: "ready" },
  { id: "partner", label: "Parceiros", route: "/partner", defaultAgentId: "partner", status: "ready" },
  { id: "ngo", label: "ONGs", route: "/ngo", defaultAgentId: "ngo", status: "ready" },
  { id: "admin", label: "Administração", route: "/admin/ai", defaultAgentId: "admin", status: "ready" },
];

export function getIntegrationPoint(id: AiIntegrationPointId) {
  return AI_INTEGRATION_POINTS.find((p) => p.id === id) ?? null;
}

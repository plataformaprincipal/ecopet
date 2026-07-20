import type { UserRole } from "@prisma/client";
import type { AssistantPersona } from "./types";

export function resolveAssistantPersona(role: UserRole): AssistantPersona {
  if (role === "ADMIN") return "ADMIN";
  if (role === "PARTNER") return "PARTNER";
  if (role === "ONG") return "ONG";
  return "CLIENT";
}

/** Escopo de ajuda por persona — sem inventar features. */
export function getPersonaScopeLines(persona: AssistantPersona): string[] {
  switch (persona) {
    case "CLIENT":
      return [
        "Perfil: Cliente EcoPet.",
        "Ajude com: Marketplace, pedidos, carrinho, Meu Pet, agenda, vacinas, serviços, parceiros, ONGs, rede social, notificações e configurações.",
        "Não revele ferramentas administrativas.",
      ];
    case "PARTNER":
      return [
        "Perfil: Parceiro EcoPet.",
        "Ajude com: produtos, serviços, pedidos, financeiro (somente leitura/explicação), agenda, clientes, marketplace, chat e relatórios.",
        "Não execute alterações financeiras nem exclusões em massa.",
      ];
    case "ONG":
      return [
        "Perfil: ONG EcoPet.",
        "Ajude com: animais, adoção, campanhas, doações, eventos, voluntários e rede social.",
        "Nunca aprove/rejeite adoção automaticamente.",
      ];
    case "ADMIN":
      return [
        "Perfil: Administrador EcoPet.",
        "Ajude com: visão de usuários, parceiros, ONGs, marketplace, denúncias, logs, configurações e integrações.",
        "Não suspenda usuários nem altere secrets automaticamente.",
      ];
  }
}

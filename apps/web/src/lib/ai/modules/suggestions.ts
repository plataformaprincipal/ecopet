import type { AssistantPersona } from "@/lib/ai/assistant/types";
import type { AiLocale } from "@/lib/ai/ai-config";

const PT: Record<AssistantPersona, string[]> = {
  CLIENT: [
    "Quais produtos de ração estão disponíveis?",
    "Mostre meus próximos agendamentos",
    "Como está meu carrinho?",
    "Resumo dos meus pets e vacinas",
    "Tenho notificações não lidas?",
    "Onde encontro serviços de banho e tosa?",
  ],
  PARTNER: [
    "Resumo do meu painel de parceiro",
    "Quais pedidos recentes tenho?",
    "Como estão meus próximos atendimentos?",
    "Quais avaliações recentes recebi?",
    "Como publicar um novo produto?",
    "Onde vejo meu catálogo no Marketplace?",
  ],
  ONG: [
    "Resumo da minha ONG",
    "Quantos animais estão disponíveis para adoção?",
    "Como criar uma campanha?",
    "Pedidos de adoção pendentes",
    "Como divulgar adoção na rede social?",
    "Onde gerencio doações?",
  ],
  ADMIN: [
    "Como acessar moderação e denúncias?",
    "Onde vejo saúde das integrações?",
    "Como revisar logs da plataforma de IA?",
    "Onde configurar Google Tag Manager?",
    "Como acompanhar custos de tokens?",
    "Quais ferramentas o assistente oferece?",
  ],
};

const EN: Record<AssistantPersona, string[]> = {
  CLIENT: [
    "What pet food products are available?",
    "Show my upcoming appointments",
    "What's in my cart?",
    "Summarize my pets and vaccines",
    "Do I have unread notifications?",
    "Where can I find grooming services?",
  ],
  PARTNER: [
    "Partner dashboard summary",
    "Show my recent orders",
    "Upcoming appointments",
    "Recent reviews",
    "How do I publish a product?",
    "Where is my marketplace catalog?",
  ],
  ONG: [
    "NGO summary",
    "How many animals are available for adoption?",
    "How do I create a campaign?",
    "Pending adoption requests",
    "How to promote adoption on social?",
    "Where do I manage donations?",
  ],
  ADMIN: [
    "Where is moderation?",
    "Where do I check integrations health?",
    "How do I review AI logs?",
    "Where is GTM configuration?",
    "How do I track token costs?",
    "Which assistant tools are available?",
  ],
};

const ES: Record<AssistantPersona, string[]> = {
  CLIENT: [
    "¿Qué productos de alimento hay disponibles?",
    "Muéstrame mis próximas citas",
    "¿Cómo está mi carrito?",
    "Resumen de mis mascotas y vacunas",
    "¿Tengo notificaciones sin leer?",
    "¿Dónde encuentro servicios de baño y peluquería?",
  ],
  PARTNER: [
    "Resumen de mi panel de socio",
    "¿Cuáles son mis pedidos recientes?",
    "Próximas citas",
    "Reseñas recientes",
    "¿Cómo publico un producto?",
    "¿Dónde veo mi catálogo?",
  ],
  ONG: [
    "Resumen de mi ONG",
    "¿Cuántos animales están disponibles para adopción?",
    "¿Cómo creo una campaña?",
    "Solicitudes de adopción pendientes",
    "¿Cómo promociono adopción en la red social?",
    "¿Dónde gestiono donaciones?",
  ],
  ADMIN: [
    "¿Dónde está la moderación?",
    "¿Dónde veo la salud de integraciones?",
    "¿Cómo reviso logs de IA?",
    "¿Dónde configuro GTM?",
    "¿Cómo veo costos de tokens?",
    "¿Qué herramientas tiene el asistente?",
  ],
};

export function getSmartSuggestions(persona: AssistantPersona, locale: AiLocale): string[] {
  if (locale === "en-US") return EN[persona];
  if (locale === "es-ES") return ES[persona];
  return PT[persona];
}

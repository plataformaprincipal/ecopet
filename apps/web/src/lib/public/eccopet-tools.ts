import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Bell,
  Brain,
  Calendar,
  ClipboardList,
  GitCompare,
  Heart,
  MessageCircle,
  ScanSearch,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export type EccoPetToolStatus = "demo" | "coming_soon" | "available";

export type EccoPetTool = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: EccoPetToolStatus;
  demoPrompt?: string;
  demoReply?: string;
};

export const ECCOPET_AI_DISCLAIMER =
  "As ferramentas de IA não substituem avaliação veterinária.";

export const ECCOPET_TOOLS: EccoPetTool[] = [
  {
    id: "assistant",
    title: "Assistente Pet",
    description: "Tire dúvidas sobre rotina, comportamento e bem-estar do seu pet.",
    icon: MessageCircle,
    status: "demo",
    demoPrompt: "Meu cão está muito agitado à noite. O que posso fazer?",
    demoReply:
      "Modo demonstração: mantenha horários regulares de passeio, enriquecimento ambiental e evite telas antes de dormir. Se persistir, consulte um veterinário comportamentalista.",
  },
  {
    id: "nutrition",
    title: "Guia de Alimentação",
    description: "Orientações gerais sobre porções, frequência e tipos de alimento.",
    icon: Apple,
    status: "demo",
    demoPrompt: "Quantas vezes devo alimentar um filhote de gato?",
    demoReply:
      "Modo demonstração: filhotes geralmente comem 3–4 refeições/dia. Ajuste conforme peso, raça e orientação do médico veterinário.",
  },
  {
    id: "reminders",
    title: "Lembretes Inteligentes",
    description: "Organize vacinas, banho, consultas e medicamentos.",
    icon: Bell,
    status: "coming_soon",
  },
  {
    id: "compare",
    title: "Comparador de Produtos",
    description: "Compare rações, acessórios e itens do marketplace.",
    icon: GitCompare,
    status: "coming_soon",
  },
  {
    id: "routine",
    title: "Sugestão de Rotina",
    description: "Monte uma rotina equilibrada de passeios, descanso e estímulo.",
    icon: Calendar,
    status: "demo",
    demoPrompt: "Rotina para cachorro adulto em apartamento",
    demoReply:
      "Modo demonstração: 2 passeios/dia (15–30 min), brincadeiras mentais, horários fixos de refeição e descanso. Personalize com seu veterinário.",
  },
  {
    id: "needs",
    title: "Detector de Necessidades",
    description: "Identifique sinais de atenção em comportamento e rotina.",
    icon: ScanSearch,
    status: "coming_soon",
  },
  {
    id: "vet-prep",
    title: "Preparador de Consulta Veterinária",
    description: "Organize sintomas, histórico e perguntas antes da consulta.",
    icon: Stethoscope,
    status: "demo",
    demoPrompt: "Checklist para consulta de check-up anual",
    demoReply:
      "Modo demonstração: anote vacinas, vermífugo, alimentação, peso, mudanças de comportamento e medicamentos. Leve exames recentes, se houver.",
  },
  {
    id: "profile",
    title: "Analisador de Perfil do Pet",
    description: "Resumo inteligente do perfil, preferências e histórico.",
    icon: Brain,
    status: "coming_soon",
  },
  {
    id: "adoption",
    title: "Planejador de Adoção",
    description: "Prepare sua casa e rotina para receber um novo pet.",
    icon: Heart,
    status: "demo",
    demoPrompt: "Primeiros passos para adotar um gato adulto",
    demoReply:
      "Modo demonstração: ambiente seguro, caixa de areia, alimentação adequada, visita veterinária inicial e paciência na adaptação.",
  },
  {
    id: "vaccines",
    title: "Organizador de Vacinas",
    description: "Acompanhe calendário vacinal e reforços importantes.",
    icon: ClipboardList,
    status: "coming_soon",
  },
];

export const ECCOPET_HERO = {
  title: "EccoPet",
  subtitle: "Inteligência artificial pensada para tutores, parceiros e ONGs.",
  badge: "IA",
  icon: Sparkles,
} as const;

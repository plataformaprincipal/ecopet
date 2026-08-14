import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  CalendarClock,
  Coins,
  Heart,
  Headset,
  PawPrint,
  Package,
  Scissors,
  ShoppingBag,
  Sparkles,
  Syringe,
  TrendingUp,
} from "lucide-react";

/** Somente ferramentas reais entram no catálogo — nada de demonstração. */
export type EccoPetToolStatus = "available";

export type EccoPetTool = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: EccoPetToolStatus;
  /** Prompt real enviado ao assistente ao clicar na ferramenta. */
  prompt: string;
};

export const ECCOPET_AI_DISCLAIMER =
  "As ferramentas de IA não substituem avaliação veterinária.";

export const ECCOPET_TOOLS: EccoPetTool[] = [
  {
    id: "pets",
    title: "Meus pets",
    description: "Resumo dos pets cadastrados, lembretes e cuidados em aberto.",
    icon: PawPrint,
    status: "available",
    prompt: "Quais pets eu tenho?",
  },
  {
    id: "vaccines",
    title: "Vacinas",
    description: "Situação do calendário vacinal e reforços atrasados.",
    icon: Syringe,
    status: "available",
    prompt: "Tenho alguma vacina atrasada?",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    description: "Busca de produtos reais do marketplace por tipo e preço.",
    icon: ShoppingBag,
    status: "available",
    prompt: "Procure ração para cachorro até R$150.",
  },
  {
    id: "services",
    title: "Serviços",
    description: "Serviços de parceiros verificados, como banho e tosa.",
    icon: Scissors,
    status: "available",
    prompt: "Procure banho e tosa perto de mim.",
  },
  {
    id: "agenda",
    title: "Agenda",
    description: "Compromissos e atendimentos já marcados.",
    icon: CalendarClock,
    status: "available",
    prompt: "O que tenho marcado na agenda?",
  },
  {
    id: "orders",
    title: "Pedidos",
    description: "Status dos seus pedidos no marketplace.",
    icon: Package,
    status: "available",
    prompt: "Quais são meus pedidos?",
  },
  {
    id: "loyalty",
    title: "EccoPontos",
    description: "Saldo, nível e movimentações do programa de fidelidade.",
    icon: Coins,
    status: "available",
    prompt: "Quantos EccoPontos eu tenho?",
  },
  {
    id: "adoption",
    title: "Adoção",
    description: "Animais disponíveis em ONGs verificadas.",
    icon: Heart,
    status: "available",
    prompt: "Quero adotar um gato.",
  },
  {
    id: "social",
    title: "Em alta",
    description: "Assuntos, perfis e destaques em alta na plataforma.",
    icon: TrendingUp,
    status: "available",
    prompt: "O que está em alta na EccoPet?",
  },
  {
    id: "support",
    title: "Suporte",
    description: "Abertura de atendimento com a equipe EccoPet.",
    icon: Headset,
    status: "available",
    prompt: "Preciso falar com o suporte.",
  },
  {
    id: "a11y",
    title: "Acessibilidade",
    description: "Ajuste tema, fonte e linguagem simples por comando.",
    icon: Accessibility,
    status: "available",
    prompt: "Ative linguagem simples.",
  },
];

export const ECCOPET_HERO = {
  title: "EccoPet",
  subtitle: "Inteligência artificial pensada para tutores, parceiros e ONGs.",
  badge: "IA",
  icon: Sparkles,
} as const;

/** Domínios do Centro de Inteligência Analítica. */

export const BI_DOMAINS = [
  "executive",
  "google-analytics",
  "performance",
  "conversoes",
  "usuarios",
  "marketplace",
  "social",
  "parceiros",
  "ongs",
  "servicos",
  "financeiro",
  "alertas",
  "exportacoes",
] as const;

export type BiDomain = (typeof BI_DOMAINS)[number];

export type BiDomainMeta = {
  id: BiDomain;
  label: string;
  description: string;
  href: string;
};

export const BI_DOMAIN_META: BiDomainMeta[] = [
  {
    id: "executive",
    label: "Dashboard Executivo",
    description: "Visão consolidada da plataforma EcoPet.",
    href: "/admin/bi",
  },
  {
    id: "google-analytics",
    label: "Google Analytics",
    description: "Aquisição, engajamento, tecnologia e UTMs (Data API).",
    href: "/admin/bi/google-analytics",
  },
  {
    id: "performance",
    label: "Performance",
    description: "Sessões proxy, atividade e saúde operacional.",
    href: "/admin/bi/performance",
  },
  {
    id: "conversoes",
    label: "Conversões",
    description: "Funil de pedidos, cadastros e taxa de conversão.",
    href: "/admin/bi/conversoes",
  },
  {
    id: "usuarios",
    label: "Usuários",
    description: "Cadastros, retenção e primeiros acessos.",
    href: "/admin/bi/usuarios",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Produtos, carrinhos, receita e avaliações.",
    href: "/admin/bi/marketplace",
  },
  {
    id: "social",
    label: "Rede Social",
    description: "Posts, curtidas, comentários e engajamento.",
    href: "/admin/bi/social",
  },
  {
    id: "parceiros",
    label: "Parceiros",
    description: "Ranking, pedidos e receita por parceiro.",
    href: "/admin/bi/parceiros",
  },
  {
    id: "ongs",
    label: "ONGs",
    description: "Animais, adoções e atividade de ONGs.",
    href: "/admin/bi/ongs",
  },
  {
    id: "servicos",
    label: "Serviços",
    description: "Agendamentos, conclusões e cancelamentos.",
    href: "/admin/bi/servicos",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    description: "Receita, ticket médio e volume de pedidos.",
    href: "/admin/bi/financeiro",
  },
  {
    id: "alertas",
    label: "Alertas",
    description: "Anomalias e saúde das integrações analíticas.",
    href: "/admin/bi/alertas",
  },
  {
    id: "exportacoes",
    label: "Exportações",
    description: "CSV, Excel, PDF e JSON sanitizados.",
    href: "/admin/bi/exportacoes",
  },
];

export function isBiDomain(value: string): value is BiDomain {
  return (BI_DOMAINS as readonly string[]).includes(value);
}

export function resolveBiDomain(value: string | undefined | null): BiDomain {
  if (value && isBiDomain(value)) return value;
  return "executive";
}

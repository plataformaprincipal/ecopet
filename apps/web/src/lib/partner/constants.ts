import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Heart,
  Leaf,
  PawPrint,
  Stethoscope,
  Truck,
  GraduationCap,
  Shield,
  Cpu,
  Fish,
  Bird,
  Wheat,
  Home,
  Sparkles,
  ShoppingBag,
  Dumbbell,
  Calendar,
} from "lucide-react";

export type PartnerType = "AUTONOMOUS" | "CORPORATE";

export const PARTNER_TYPE_REQUIRED_MESSAGE = "Selecione o tipo de parceiro para continuar.";

export const PARTNER_TYPES: {
  value: PartnerType;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "AUTONOMOUS",
    label: "Profissional Autônomo",
    description: "Sou profissional independente e atuo em nome próprio.",
    icon: Briefcase,
  },
  {
    value: "CORPORATE",
    label: "MEI / Empresa / Prestadora de Serviço",
    description: "Tenho CNPJ, nome comercial, razão social ou presto serviços como pessoa jurídica.",
    icon: Building2,
  },
];

export const ACTIVITY_AREAS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "SAUDE_ANIMAL", label: "Saúde Animal", icon: Stethoscope },
  { value: "ESTETICA_BEM_ESTAR", label: "Estética e Bem-Estar", icon: Sparkles },
  { value: "COMERCIO_PET", label: "Comércio Pet", icon: ShoppingBag },
  { value: "ALIMENTACAO", label: "Alimentação", icon: Leaf },
  { value: "HOSPEDAGEM_CRECHE", label: "Hospedagem e Creche", icon: Home },
  { value: "TREINAMENTO", label: "Treinamento e Comportamento", icon: Dumbbell },
  { value: "TRANSPORTE", label: "Transporte", icon: Truck },
  { value: "REPRODUCAO", label: "Reprodução e Genética", icon: PawPrint },
  { value: "EVENTOS", label: "Eventos e Lazer", icon: Calendar },
  { value: "SERVICOS_TECNICOS", label: "Serviços Técnicos", icon: Briefcase },
  { value: "EQUINOS", label: "Equinos", icon: PawPrint },
  { value: "BOVINOS_AGRO", label: "Bovinos e Agro", icon: Wheat },
  { value: "AQUARISMO", label: "Aquarismo", icon: Fish },
  { value: "EXOTICOS", label: "Animais Exóticos", icon: Bird },
  { value: "TECNOLOGIA", label: "Tecnologia", icon: Cpu },
  { value: "EDUCACAO", label: "Educação", icon: GraduationCap },
  { value: "PROTECAO_ANIMAL", label: "Proteção Animal", icon: Shield },
  { value: "OUTROS", label: "Outros", icon: Heart },
];

export const STREET_TYPES = [
  "Rua",
  "Avenida",
  "Travessa",
  "Alameda",
  "Praça",
  "Estrada",
  "Rodovia",
  "Ladeira",
  "Viela",
  "Condomínio",
  "Sítio",
  "Fazenda",
  "Chácara",
  "Comunidade",
  "Distrito",
  "Outro",
] as const;

export const CORPORATE_TYPES = [
  "MEI",
  "Microempresa",
  "Empresa de Pequeno Porte",
  "Empresa Ltda.",
  "Sociedade Simples",
  "Associação",
  "Cooperativa",
  "Prestadora de Serviço",
  "Outro",
] as const;

export const OPERATION_MODES = [
  { value: "FIXED_HOURS", label: "Horário Fixo" },
  { value: "SPECIFIC_DAYS", label: "Horários Específicos" },
  { value: "BY_APPOINTMENT", label: "Sob Agendamento" },
  { value: "EMERGENCY", label: "Atendimento Emergencial" },
  { value: "HOURS_24", label: "Atendimento 24 Horas" },
] as const;

export const WEEKDAYS = [
  { value: "MON", label: "Segunda-feira" },
  { value: "TUE", label: "Terça-feira" },
  { value: "WED", label: "Quarta-feira" },
  { value: "THU", label: "Quinta-feira" },
  { value: "FRI", label: "Sexta-feira" },
  { value: "SAT", label: "Sábado" },
  { value: "SUN", label: "Domingo" },
] as const;

export const SERVICE_RADIUS_OPTIONS = [
  { value: "LOCAL_ONLY", label: "Atendo apenas no local" },
  { value: "KM_2", label: "Até 2 km" },
  { value: "KM_5", label: "Até 5 km" },
  { value: "KM_10", label: "Até 10 km" },
  { value: "KM_20", label: "Até 20 km" },
  { value: "KM_50", label: "Até 50 km" },
  { value: "REGIONAL", label: "Atendimento regional" },
  { value: "NATIONAL", label: "Atendimento nacional" },
  { value: "REMOTE", label: "Atendimento online/remoto" },
] as const;

export const DELIVERY_OPTIONS = [
  { value: "DELIVERY", label: "Realizo entrega" },
  { value: "TELEBUS", label: "Realizo tele-busca" },
  { value: "CLIENT_DROPOFF", label: "Cliente entrega no local" },
  { value: "HOME_SERVICE", label: "Atendimento domiciliar" },
] as const;

export const PAYMENT_METHODS = [
  "Pix",
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Boleto",
  "Transferência bancária",
  "Link de pagamento",
  "Carteira digital",
  "Apple Pay",
  "Google Pay",
  "Mercado Pago",
  "PicPay",
  "PayPal",
  "PagSeguro",
  "Stripe",
  "Pagar.me",
  "Pagamento no local",
  "Pagamento na retirada",
  "Pagamento na entrega",
  "Assinatura mensal",
  "Sob consulta",
] as const;

export const PIX_KEY_TYPES = ["CPF", "CNPJ", "E-mail", "Telefone", "Chave aleatória"] as const;

export const BANK_OPTIONS = [
  "Banco do Brasil",
  "Caixa Econômica Federal",
  "Bradesco",
  "Itaú",
  "Santander",
  "Nubank",
  "Inter",
  "C6 Bank",
  "Sicredi",
  "Sicoob",
  "Banco Pan",
  "BTG Pactual",
  "Mercado Pago",
  "PagSeguro",
  "Stone",
  "PicPay",
  "Outros",
] as const;

export const ACCOUNT_TYPES = ["Corrente", "Poupança", "Pagamento"] as const;

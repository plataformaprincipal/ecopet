import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Heart,
  PawPrint,
  Shield,
  Stethoscope,
  Users,
  Megaphone,
  HandHeart,
  Calendar,
  AlertTriangle,
  GraduationCap,
  Leaf,
  Home,
  Hospital,
  Sparkles,
} from "lucide-react";

export type OngType = "INDIVIDUAL" | "INSTITUTION";

export const ONG_TYPE_REQUIRED_MESSAGE = "Selecione como você atua na proteção animal.";

export const ONG_TYPES: {
  value: OngType;
  label: string;
  description: string;
  documentLabel: string;
  icon: LucideIcon;
}[] = [
  {
    value: "INDIVIDUAL",
    label: "Protetor Individual",
    description:
      "Atuo individualmente realizando resgates, adoções, cuidados, lares temporários e ações de proteção animal.",
    documentLabel: "CPF",
    icon: Heart,
  },
  {
    value: "INSTITUTION",
    label: "ONG / Instituto / Associação",
    description:
      "Represento uma organização, instituto, associação ou entidade voltada à proteção animal.",
    documentLabel: "CNPJ",
    icon: Building2,
  },
];

export const INDIVIDUAL_ACTION_AREAS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "RESCUE", label: "Resgate Animal", icon: PawPrint },
  { value: "ADOPTION", label: "Adoção", icon: Heart },
  { value: "FOSTER", label: "Lar Temporário", icon: Home },
  { value: "NEUTERING", label: "Castração", icon: Stethoscope },
  { value: "FEEDING", label: "Alimentação Animal", icon: HandHeart },
  { value: "EDUCATION", label: "Educação Animal", icon: GraduationCap },
  { value: "AWARENESS", label: "Conscientização", icon: Megaphone },
  { value: "PROTECTION", label: "Proteção Animal", icon: Shield },
  { value: "DEFENSE", label: "Defesa Animal", icon: Shield },
  { value: "EMERGENCY", label: "Atendimento Emergencial", icon: AlertTriangle },
  { value: "CAMPAIGNS", label: "Campanhas Solidárias", icon: Sparkles },
  { value: "FUNDRAISING", label: "Arrecadações", icon: HandHeart },
  { value: "ADOPTION_FAIRS", label: "Feiras de Adoção", icon: Calendar },
  { value: "OUTROS", label: "Outros", icon: Leaf },
];

export const INSTITUTION_ACTION_AREAS: { value: string; label: string; icon: LucideIcon }[] = [
  ...INDIVIDUAL_ACTION_AREAS.filter((a) => a.value !== "FUNDRAISING"),
  { value: "SHELTER", label: "Abrigo Animal", icon: Home },
  { value: "SOCIAL_VET", label: "Hospital Veterinário Social", icon: Hospital },
  { value: "OUTROS", label: "Outros", icon: Leaf },
];

export const ONG_REPRESENTATIVE_ROLES = [
  "Presidente",
  "Diretor(a)",
  "Fundador(a)",
  "Coordenador(a)",
  "Representante Legal",
  "Outro",
] as const;

export const ONG_FOCUS_AREAS = [
  "Proteção Animal",
  "Resgate e Adoção",
  "Saúde Animal",
  "Educação e Conscientização",
  "Defesa dos Direitos Animais",
  "Outro",
] as const;

export const BRAND = {
  name: "ECOPET",
  tagline: "Ecossistema pet inteligente",
  colors: {
    dark: "#1A3A2A",
    green: "#2E7D4F",
    yellow: "#F5C800",
    white: "#FFFFFF",
    gray: "#4A4A5A",
  },
} as const;

import { getClientApiUrl } from "./api-url.client";

export const API_URL = getClientApiUrl();

export const AI_DISCLAIMER =
  "A IA ECOPET não substitui um veterinário. Em caso de emergência, procure atendimento profissional imediatamente.";

export const USER_ROLES = {
  TUTOR: "Tutor",
  VETERINARIAN: "Veterinário",
  CLINIC: "Clínica Veterinária",
  PETSHOP: "Pet Shop",
  SELLER: "Seller / Loja Parceira",
  SERVICE_PROVIDER: "Prestador de Serviço",
  ONG: "ONG / Protetor Animal",
  ADMIN: "Administrador",
  DELIVERY: "Entregador",
  INFLUENCER: "Influenciador",
  PARTNER: "Parceiro",
} as const;

export const NAV_ITEMS = [
  { href: "/inicio", label: "Início", icon: "Home" },
  { href: "/explorar", label: "Explorar", icon: "Compass" },
  { href: "/marketplace", label: "Marketplace", icon: "ShoppingBag" },
  { href: "/meu-pet", label: "Meu Pet", icon: "PawPrint" },
  { href: "/perfil", label: "Perfil", icon: "User" },
] as const;

import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade e proteção de dados da ECOPET.",
};

const SECTIONS = [
  {
    title: "1. Introdução",
    paragraphs: [
      "A ECOPET respeita a privacidade de seus usuários e trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
    ],
  },
  {
    title: "2. Dados coletados",
    paragraphs: ["Coletamos dados cadastrais, de contato, autenticação, pets, transações e logs de uso conforme o perfil."],
  },
  {
    title: "3. Direitos do titular",
    paragraphs: [
      "Você pode solicitar acesso, correção, portabilidade, revogação de consentimento e exclusão via /legal/lgpd ou APIs autenticadas.",
    ],
  },
  {
    title: "4. Contato",
    paragraphs: ["Encarregado: privacidade@ecopet.com.br"],
  },
  {
    title: "5. Prevenção a bots (Turnstile) — nota técnica",
    paragraphs: [
      "Para prevenir spam e abuso, formulários públicos e fluxos de autenticação de risco podem utilizar o Cloudflare Turnstile. O desafio envia um token de verificação ao provedor; a Secret Key permanece apenas no servidor. O EcoPet não armazena o token e registra apenas métricas sanitizadas (resultado, action, hostname, códigos de erro). [Revisão jurídica recomendada antes de tratar este parágrafo como cláusula contratual definitiva.]",
    ],
  },
];

export default function LegalPrivacidadePage() {
  return <LegalPageLayout title="Política de Privacidade" updatedAt="18 de julho de 2026" sections={SECTIONS} />;
}

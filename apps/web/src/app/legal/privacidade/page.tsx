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
];

export default function LegalPrivacidadePage() {
  return <LegalPageLayout title="Política de Privacidade" updatedAt="15 de junho de 2026" sections={SECTIONS} />;
}

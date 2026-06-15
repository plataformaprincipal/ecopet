import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso da plataforma ECOPET.",
};

const SECTIONS = [
  {
    title: "1. Aceite",
    paragraphs: ["Ao utilizar a ECOPET, você concorda com estes Termos e com a Política de Privacidade."],
  },
  {
    title: "2. Contas e perfis",
    paragraphs: [
      "CLIENT, PARTNER, ONG e ADMIN possuem permissões distintas. Contas PENDING, REJECTED ou SUSPENDED têm acesso limitado ou bloqueado.",
    ],
  },
  {
    title: "3. Marketplace e conteúdo",
    paragraphs: [
      "Parceiros são responsáveis por produtos e serviços publicados. Conteúdo social deve respeitar regras de convivência e moderação.",
    ],
  },
  {
    title: "4. Suspensão",
    paragraphs: ["A ECOPET pode suspender contas em caso de violação destes Termos ou risco à comunidade."],
  },
];

export default function LegalTermosPage() {
  return <LegalPageLayout title="Termos de Uso" updatedAt="15 de junho de 2026" sections={SECTIONS} />;
}

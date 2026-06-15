import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Como a ECOPET utiliza cookies e tecnologias similares.",
};

const SECTIONS = [
  {
    title: "1. O que são cookies",
    paragraphs: ["Cookies são arquivos armazenados no navegador para manter sessão, preferências e medir uso."],
  },
  {
    title: "2. Cookies essenciais",
    paragraphs: ["Utilizamos cookies de sessão (httpOnly) para autenticação segura."],
  },
  {
    title: "3. Gerenciamento",
    paragraphs: ["Você pode bloquear cookies no navegador; funcionalidades de login podem ser afetadas."],
  },
];

export default function LegalCookiesPage() {
  return <LegalPageLayout title="Política de Cookies" updatedAt="15 de junho de 2026" sections={SECTIONS} />;
}

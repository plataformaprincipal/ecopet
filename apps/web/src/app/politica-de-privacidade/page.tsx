import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade e proteção de dados da ECOPET.",
};

const SECTIONS = [
  {
    title: "1. Introdução",
    paragraphs: [
      "A ECOPET respeita a privacidade de seus usuários e trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
      "Esta Política descreve quais dados coletamos, para quais finalidades, como protegemos as informações e quais são os direitos dos titulares.",
    ],
  },
  {
    title: "2. Dados coletados",
    paragraphs: ["Podemos coletar, conforme o perfil de uso:"],
    list: [
      "Dados de identificação: nome, CPF, CNPJ, e-mail, telefone, endereço e documentos.",
      "Dados de autenticação: senha criptografada, tokens de sessão e logs de acesso.",
      "Dados de navegação: IP, dispositivo, navegador, cookies e interações na plataforma.",
      "Dados de pagamento e transações, quando aplicável ao marketplace.",
    ],
  },
  {
    title: "3. Finalidade do tratamento",
    paragraphs: [
      "Os dados são tratados para viabilizar cadastro, autenticação, personalização, marketplace, adoção, serviços, comunicações, suporte, segurança, prevenção a fraudes, cumprimento legal e melhoria contínua da plataforma.",
    ],
  },
  {
    title: "4. Dados dos pets",
    paragraphs: [
      "Informações sobre pets incluem nome, espécie, raça, idade, peso, histórico de saúde, fotos e preferências.",
      "Esses dados são utilizados para serviços veterinários, recomendações, agenda, marketplace pet e funcionalidades de bem-estar animal.",
    ],
  },
  {
    title: "5. Dados dos usuários",
    paragraphs: [
      "Tutores, profissionais e demais usuários pessoa física têm seus dados tratados conforme a relação estabelecida com a plataforma e com outros usuários parceiros.",
    ],
  },
  {
    title: "6. Dados de ONGs",
    paragraphs: [
      "ONGs e protetores informam documentos, responsáveis, capacidade de acolhimento, campanhas e histórico de atuação para validação e transparência nas ações de adoção e resgate.",
    ],
  },
  {
    title: "7. Dados empresariais",
    paragraphs: [
      "Empresas parceiras fornecem razão social, CNPJ, responsáveis, endereços comerciais, documentos fiscais e informações necessárias para operação no marketplace e serviços B2B.",
    ],
  },
  {
    title: "8. Cookies",
    paragraphs: [
      "Utilizamos cookies e tecnologias similares para manter sessões, lembrar preferências, medir desempenho e aprimorar a experiência.",
      "O usuário pode gerenciar cookies pelo navegador, ciente de que algumas funcionalidades podem ser afetadas.",
    ],
  },
  {
    title: "9. Segurança da informação",
    paragraphs: [
      "Adotamos medidas técnicas e administrativas como criptografia de senhas, controle de acesso, auditoria, monitoramento de eventos de segurança e backups.",
      "Apesar dos esforços, nenhum sistema é totalmente imune a riscos; recomendamos senhas fortes e uso responsável das credenciais.",
    ],
  },
  {
    title: "10. Compartilhamento de dados",
    paragraphs: [
      "Dados podem ser compartilhados com parceiros envolvidos em transações, prestadores de infraestrutura, meios de pagamento e autoridades, quando exigido por lei.",
      "Não vendemos dados pessoais. Compartilhamentos ocorrem com base legal, contrato ou consentimento, conforme aplicável.",
    ],
  },
  {
    title: "11. Direitos do titular",
    paragraphs: ["Nos termos da LGPD, o titular pode solicitar:"],
    list: [
      "Confirmação de tratamento e acesso aos dados.",
      "Correção de dados incompletos ou desatualizados.",
      "Anonimização, bloqueio ou eliminação de dados desnecessários.",
      "Portabilidade, informação sobre compartilhamentos e revogação de consentimento.",
    ],
  },
  {
    title: "12. Exclusão de dados",
    paragraphs: [
      "A exclusão pode ser solicitada pelos canais oficiais de contato. Determinados registros poderão ser mantidos para cumprimento de obrigações legais, resolução de disputas e prevenção a fraudes.",
    ],
  },
  {
    title: "13. LGPD",
    paragraphs: [
      "A ECOPET trata dados pessoais com base em fundamentos legais previstos na LGPD, incluindo execução de contrato, legítimo interesse, cumprimento de obrigação legal e consentimento, quando necessário.",
    ],
  },
  {
    title: "14. Contato do encarregado",
    paragraphs: [
      "Para exercer direitos ou esclarecer dúvidas sobre privacidade, entre em contato:",
      "E-mail: privacidade@ecopet.com.br | Suporte: suporte@ecopet.com.br | Contato geral: contato@ecopet.com.br",
    ],
  },
];

export default function PoliticaPrivacidadePage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade ECOPET"
      updatedAt="24 de maio de 2026"
      sections={SECTIONS}
    />
  );
}

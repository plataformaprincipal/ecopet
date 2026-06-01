import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso da plataforma ECOPET.",
};

const SECTIONS = [
  {
    title: "1. Apresentação da plataforma ECOPET",
    paragraphs: [
      "A ECOPET é uma plataforma digital inteligente dedicada ao universo pet e AgroPet, reunindo tutores, profissionais, empresas, ONGs, protetores e parceiros em um ecossistema integrado de serviços, marketplace, adoção, saúde animal, rede social e inteligência artificial.",
      "Ao utilizar a ECOPET, o usuário declara ter lido, compreendido e aceitado integralmente estes Termos de Uso.",
    ],
  },
  {
    title: "2. Cadastro de usuários",
    paragraphs: [
      "O cadastro na ECOPET exige informações verdadeiras, completas e atualizadas. Cada pessoa física ou jurídica deve manter apenas uma conta principal, salvo perfis complementares autorizados pela plataforma.",
      "O usuário é responsável pela confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.",
    ],
  },
  {
    title: "3. Cadastro de pets",
    paragraphs: [
      "Tutores podem cadastrar pets vinculados à sua conta, informando dados como espécie, raça, idade, histórico de saúde e fotografias.",
      "As informações dos pets devem ser precisas e utilizadas exclusivamente para fins legítimos dentro da plataforma, como saúde, serviços, adoção autorizada e recomendações personalizadas.",
    ],
  },
  {
    title: "4. Cadastro de ONGs e protetores",
    paragraphs: [
      "ONGs formalizadas e protetores independentes podem se cadastrar informando documentos válidos (CPF ou CNPJ), dados de contato, área de atuação e capacidade de acolhimento.",
      "A ECOPET pode solicitar documentação complementar para validação e aprovação de contas vinculadas a resgate, adoção e campanhas.",
    ],
  },
  {
    title: "5. Cadastro de empresas e parceiros",
    paragraphs: [
      "Clínicas, pet shops, sellers, prestadores de serviço e demais parceiros comerciais devem informar razão social, nome fantasia, CNPJ, responsável legal e documentos exigidos para operação na plataforma.",
      "Parceiros são responsáveis pelos produtos, serviços, preços, prazos, entregas e atendimentos oferecidos por meio da ECOPET.",
    ],
  },
  {
    title: "6. Marketplace",
    paragraphs: [
      "O marketplace ECOPET conecta compradores e vendedores. A plataforma atua como intermediadora tecnológica, não sendo proprietária dos produtos anunciados, salvo quando expressamente indicado.",
      "Transações estão sujeitas às políticas comerciais de cada parceiro, bem como às regras de pagamento, entrega, troca e devolução publicadas na plataforma.",
    ],
  },
  {
    title: "7. Responsabilidade dos usuários",
    paragraphs: [
      "Cada usuário é integralmente responsável pelo conteúdo publicado, pelas interações realizadas e pelas informações fornecidas no cadastro e durante o uso da plataforma.",
      "É proibido utilizar a ECOPET para fins ilícitos, abusivos, discriminatórios, fraudulentos ou que violem direitos de terceiros.",
    ],
  },
  {
    title: "8. Responsabilidade sobre informações cadastradas",
    paragraphs: [
      "O usuário garante a veracidade dos dados informados e compromete-se a mantê-los atualizados.",
      "Informações falsas, incompletas ou desatualizadas podem resultar em suspensão, bloqueio ou exclusão da conta, sem prejuízo de medidas legais cabíveis.",
    ],
  },
  {
    title: "9. Proibição de maus-tratos",
    paragraphs: [
      "A ECOPET repudia qualquer forma de maus-tratos, abandono, exploração ou comercialização irregular de animais.",
      "Conteúdos ou condutas que indiquem crueldade animal serão removidos e reportados às autoridades competentes, quando aplicável.",
    ],
  },
  {
    title: "10. Proibição de fraudes",
    paragraphs: [
      "É vedada a criação de contas falsas, uso indevido de documentos de terceiros, manipulação de avaliações, golpes financeiros, phishing ou qualquer tentativa de fraude.",
      "A ECOPET adota mecanismos de segurança, auditoria e monitoramento para identificar e coibir práticas fraudulentas.",
    ],
  },
  {
    title: "11. Política de denúncias",
    paragraphs: [
      "Usuários podem denunciar perfis, anúncios, publicações ou condutas que violem estes Termos ou a legislação vigente.",
      "Denúncias são analisadas pela equipe ECOPET, que poderá solicitar informações adicionais, aplicar advertências, remover conteúdos ou suspender contas.",
    ],
  },
  {
    title: "12. Política de bloqueio",
    paragraphs: [
      "Contas podem ser temporária ou permanentemente bloqueadas em casos de violação dos Termos, suspeita de fraude, maus-tratos, reincidência de denúncias ou determinação legal.",
      "O bloqueio pode restringir login, publicações, transações e demais funcionalidades até conclusão da análise.",
    ],
  },
  {
    title: "13. Política de exclusão de contas",
    paragraphs: [
      "O usuário pode solicitar a exclusão de sua conta conforme a Política de Privacidade e a LGPD.",
      "A ECOPET poderá reter determinados registros pelo prazo legal necessário para cumprimento de obrigações, prevenção a fraudes e resguardo de direitos.",
    ],
  },
  {
    title: "14. Direitos autorais",
    paragraphs: [
      "Marcas, logotipos, layout, software, textos, imagens institucionais e demais conteúdos produzidos pela ECOPET são protegidos por direitos autorais e propriedade intelectual.",
      "É proibida a reprodução, distribuição ou modificação sem autorização prévia e expressa da ECOPET.",
    ],
  },
  {
    title: "15. Utilização da plataforma",
    paragraphs: [
      "A ECOPET pode atualizar funcionalidades, realizar manutenções, alterar interfaces e modificar estes Termos, comunicando os usuários quando necessário.",
      "O uso continuado da plataforma após alterações implica concordância com a versão vigente dos Termos.",
    ],
  },
  {
    title: "16. Foro",
    paragraphs: [
      "Estes Termos são regidos pelas leis da República Federativa do Brasil.",
      "Fica eleito o foro da comarca de domicílio da ECOPET, salvo disposição legal em contrário, para dirimir quaisquer controvérsias decorrentes destes Termos.",
    ],
  },
];

export default function TermosDeUsoPage() {
  return <LegalPageLayout title="Termos de Uso ECOPET" updatedAt="24 de maio de 2026" sections={SECTIONS} />;
}

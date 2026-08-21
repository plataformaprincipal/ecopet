import { AI_COMMERCE_SKUS, canonicalAiCommerceSku, type AiCommerceSku } from "./flags";

export type AiBillingType = "ONE_TIME" | "SUBSCRIPTION" | "ACTIVATION";
export type AiStoreGroup = "avaliacao" | "analise" | "acompanhamento" | "documentos";
export type AiWorkspaceKind =
  | "assessment"
  | "triage"
  | "report"
  | "exams"
  | "vision"
  | "nutri"
  | "peso"
  | "dental"
  | "behavior"
  | "vaccine"
  | "med"
  | "checkup"
  | "profile";

export type AiPriceSource = "DOCUMENT" | "DOCUMENT_DERIVED";

export type AiCommerceProductDef = {
  sku: AiCommerceSku;
  slug: (typeof import("./flags").PUBLIC_AI_PRODUCT_SLUGS)[number];
  name: string;
  tag: string;
  category: string;
  group: AiStoreGroup;
  filters: string[];
  shortDescription: string;
  longDescription: string;
  capabilityId: string;
  promptVersion: string;
  billingType: AiBillingType;
  usageLimit: number;
  unitLabel: string;
  included: string[];
  avgFillMinutes: number | null;
  maxImages: number | null;
  maxFiles: number | null;
  hasWorkbook: boolean;
  href: string;
  workspaceHref: (sessionId: string) => string;
  reportTitle: string;
  workbookTitle?: string;
  faqs: Array<{ q: string; a: string }>;
  forWhom: string[];
  howItWorks: string[];
  limitations: string[];
  exampleResult: string;
  workspaceKind: AiWorkspaceKind;
  priceSource: AiPriceSource;
  priceReference: string;
  sourceSection: string;
};

const SHARED_FAQS: Array<{ q: string; a: string }> = [
  {
    q: "A IA substitui um veterinário?",
    a: "Não. Os resultados são automatizados e orientativos. Quando necessário, procure um médico-veterinário.",
  },
  {
    q: "Meu resultado fica salvo?",
    a: "Sim. O relatório fica no histórico do pet e em Meus serviços de IA, com acesso restrito à sua conta.",
  },
  {
    q: "Posso usar para qualquer pet?",
    a: "Pode usar para os pets cadastrados na sua conta. Cada compra é vinculada a um pet.",
  },
  {
    q: "O que acontece se o processamento falhar?",
    a: "Sua utilização não é consumida. Você pode tentar novamente ou falar com o suporte.",
  },
  {
    q: "Posso comprar novamente?",
    a: "Sim. Compras avulsas liberam utilizações. Assinaturas renovam a franquia no período.",
  },
  {
    q: "Como recebo meu relatório?",
    a: "O relatório fica na ferramenta e pode ser baixado em PDF. Quando houver planilha, o XLSX também fica disponível.",
  },
  {
    q: "Posso pedir reembolso?",
    a: "Pedidos elegíveis e não utilizados seguem a política de reembolso da plataforma.",
  },
];

const HOW = ["Escolha seu pet", "Envie as informações", "A EccoPet AI processa", "Receba resultado, relatório e histórico"];

function p(partial: Omit<AiCommerceProductDef, "href" | "workspaceHref" | "faqs"> & { extraFaqs?: Array<{ q: string; a: string }> }): AiCommerceProductDef {
  const slug = partial.slug === "lab" ? "exames" : partial.slug;
  const { extraFaqs, ...rest } = partial;
  return {
    ...rest,
    slug,
    href: `/eccopet/${slug}`,
    workspaceHref: (id) => `/eccopet/${slug}/session/${id}`,
    faqs: [...SHARED_FAQS, ...(extraFaqs ?? [])],
  };
}

export const AI_COMMERCE_PRODUCTS: AiCommerceProductDef[] = [
  p({
    sku: AI_COMMERCE_SKUS.ECCOVET,
    slug: "vet",
    name: "EccoVet AI",
    tag: "Avaliação inteligente",
    category: "Avaliação",
    group: "avaliacao",
    filters: ["Todos", "Avaliação"],
    shortDescription: "Avaliação estruturada de um caso, com sinais de atenção, prioridade e próximos passos.",
    longDescription:
      "Assistente especializado para organizar queixa, histórico informado e sinais relatados. Não é chat genérico e não substitui consulta veterinária.",
    capabilityId: "eccovet.assessment",
    promptVersion: "eccovet-assessment-v1",
    billingType: "SUBSCRIPTION",
    usageLimit: 5,
    unitLabel: "plano de 30 dias",
    included: ["Avaliação estruturada", "Franquia mensal configurável", "Relatório PDF", "Plano de acompanhamento XLSX", "Histórico no pet"],
    avgFillMinutes: 8,
    maxImages: 4,
    maxFiles: 2,
    hasWorkbook: true,
    reportTitle: "Relatório EccoVet AI",
    workbookTitle: "Plano de Acompanhamento EccoVet",
    extraFaqs: [
      { q: "Posso enviar fotos?", a: "Sim, quando pertinentes. Para análise visual dedicada, use EccoVet Vision." },
      { q: "Posso enviar PDF?", a: "Sim, documentos de apoio. Para exames laboratoriais, use EccoVet Exames." },
    ],
    forWhom: ["Quando o pet apresenta um sinal novo", "Antes de uma consulta", "Acompanhamento mensal da saúde"],
    howItWorks: HOW,
    limitations: ["Não diagnostica", "Não prescreve", "Não substitui emergência"],
    exampleResult: "Resumo do caso, prioridade, o que observar e perguntas para o veterinário.",
    workspaceKind: "assessment",
    priceSource: "DOCUMENT",
    priceReference: "AI-T02",
    sourceSection: "AI-T02 — Care Navigator — R$ 29,90/tutor/mês",
  }),
  p({
    sku: AI_COMMERCE_SKUS.TRIAGE,
    slug: "triagem",
    name: "EccoVet Triagem",
    tag: "Triagem de prioridade",
    category: "Avaliação",
    group: "avaliacao",
    filters: ["Todos", "Avaliação"],
    shortDescription: "Classifica a prioridade do atendimento com base nos sinais relatados.",
    longDescription:
      "Triagem remota informativa. Não minimiza sinais potencialmente graves e orienta quando procurar atendimento.",
    capabilityId: "eccovet.triage",
    promptVersion: "eccovet-triage-v1",
    billingType: "ONE_TIME",
    usageLimit: 1,
    unitLabel: "por avaliação",
    included: ["Classificação de prioridade", "Sinais de alarme", "Ação recomendada", "PDF", "Atalho para atendimento"],
    avgFillMinutes: 6,
    maxImages: 2,
    maxFiles: null,
    hasWorkbook: false,
    reportTitle: "Resultado de Triagem EccoVet",
    extraFaqs: [{ q: "Isso substitui urgência?", a: "Não. Em dúvida ou sinais graves, procure atendimento imediatamente." }],
    forWhom: ["Quando você precisa decidir a urgência do atendimento", "Sinais agudos relatados em casa"],
    howItWorks: HOW,
    limitations: ["Não é diagnóstico", "Não substitui atendimento de emergência"],
    exampleResult: "Prioridade, justificativa, sinais de alarme e o que fazer agora.",
    workspaceKind: "triage",
    priceSource: "DOCUMENT",
    priceReference: "SAU-006",
    sourceSection: "SAU-006 — Triagem remota informativa — R$ 39,90",
  }),
  p({
    sku: AI_COMMERCE_SKUS.REPORT,
    slug: "relatorio",
    name: "EccoVet Relatório",
    tag: "Documento técnico",
    category: "Documentos e histórico",
    group: "documentos",
    filters: ["Todos", "Documentos"],
    shortDescription: "Transforma histórico, exames e arquivos do pet em um documento técnico organizado.",
    longDescription:
      "Organizador de informações para consulta, evolução ou prontuário. Pode gerar minuta técnica — nunca com assinatura falsa de veterinário.",
    capabilityId: "eccovet.report",
    promptVersion: "eccovet-report-v1",
    billingType: "ONE_TIME",
    usageLimit: 1,
    unitLabel: "por relatório",
    included: ["Relatório PDF profissional", "Linha do tempo", "Fontes utilizadas", "Minuta técnica (opcional)"],
    avgFillMinutes: 7,
    maxImages: 4,
    maxFiles: 6,
    hasWorkbook: true,
    reportTitle: "Relatório Técnico Automatizado EccoPet AI",
    workbookTitle: "Fontes do Relatório EccoVet",
    extraFaqs: [{ q: "É um laudo veterinário?", a: "Não. É documento automatizado. Revisão profissional é um fluxo futuro." }],
    forWhom: ["Preparar consulta", "Organizar histórico", "Compartilhar resumo com o responsável"],
    howItWorks: HOW,
    limitations: ["Não é laudo oficial", "Não assina em nome de veterinário"],
    exampleResult: "Capa, identificação, fontes, linha do tempo e pontos para acompanhamento.",
    workspaceKind: "report",
    priceSource: "DOCUMENT",
    priceReference: "AI-T10",
    sourceSection: "AI-T10 — Organizador de laudos — R$ 19,90/evento",
  }),
  p({
    sku: AI_COMMERCE_SKUS.EXAMS,
    slug: "exames",
    name: "EccoVet Exames",
    tag: "Análise de exames",
    category: "Análise",
    group: "analise",
    filters: ["Todos", "Exames"],
    shortDescription: "Extrai marcadores de exames e organiza leitura comparável ao longo do tempo.",
    longDescription:
      "Aceita PDF e imagens. Não inventa unidades. Quando o parsing for incerto, pede confirmação antes da interpretação.",
    capabilityId: "eccovet.exams",
    promptVersion: "eccovet-exams-v1",
    billingType: "ONE_TIME",
    usageLimit: 1,
    unitLabel: "por análise",
    included: ["Extração de analitos", "Tabela de resultados", "Evolução quando comparável", "PDF", "Planilha XLSX"],
    avgFillMinutes: 6,
    maxImages: 4,
    maxFiles: 4,
    hasWorkbook: true,
    reportTitle: "Relatório EccoVet Exames",
    workbookTitle: "Marcadores EccoVet Exames",
    extraFaqs: [
      { q: "Posso enviar PDF?", a: "Sim. PDF, JPEG, PNG ou WEBP. Prefira o documento original e nítido." },
      { q: "Posso enviar fotos?", a: "Sim, se o exame estiver legível." },
    ],
    forWhom: ["Quem recebeu um exame e quer leitura organizada", "Acompanhar evolução de marcadores"],
    howItWorks: HOW,
    limitations: ["Não diagnostica", "Não prescreve", "Não inventa referência ausente"],
    exampleResult: "Tabela de marcadores, alterações, evolução e perguntas para o veterinário.",
    workspaceKind: "exams",
    priceSource: "DOCUMENT",
    priceReference: "AI-T13",
    sourceSection: "AI-T13 — Assistente de exames — R$ 14,90/evento",
  }),
  p({
    sku: AI_COMMERCE_SKUS.VISION,
    slug: "vision",
    name: "EccoVet Vision",
    tag: "Análise visual",
    category: "Análise",
    group: "analise",
    filters: ["Todos", "Imagem"],
    shortDescription: "Envie fotos e receba avaliação estruturada de alterações aparentes.",
    longDescription:
      "Descreve somente o visível. Não altera evidência. Imagens geradas, se houver, são ilustrações educativas rotuladas.",
    capabilityId: "eccovet.vision",
    promptVersion: "eccovet-vision-v1",
    billingType: "ONE_TIME",
    usageLimit: 1,
    unitLabel: "por análise",
    included: ["Imagens", "Análise estruturada", "Sinais de atenção", "Comparação anterior", "Relatório PDF"],
    avgFillMinutes: 5,
    maxImages: 6,
    maxFiles: null,
    hasWorkbook: false,
    reportTitle: "Relatório EccoVet Vision",
    extraFaqs: [{ q: "Posso enviar fotos?", a: "Sim. JPEG, PNG ou WEBP, sem filtro, com boa luz. Até 6 imagens." }],
    forWhom: ["Alterações visíveis de pele, pelo, olhos, ouvido, pata ou ferida"],
    howItWorks: HOW,
    limitations: ["Não diagnostica pelo visual", "Não substitui foto clínica original"],
    exampleResult: "Qualidade da imagem, achados visíveis, prioridade e próximos passos.",
    workspaceKind: "vision",
    priceSource: "DOCUMENT_DERIVED",
    priceReference: "AI-T13",
    sourceSection: "Preço derivado de AI-T13 (assistente de exames / evento). SKU Vision não existia na planilha.",
  }),
  p({
    sku: AI_COMMERCE_SKUS.NUTRI,
    slug: "nutri",
    name: "EccoNutri AI",
    tag: "Nutrição orientativa",
    category: "Acompanhamento",
    group: "acompanhamento",
    filters: ["Todos", "Nutrição"],
    shortDescription: "Avaliação nutricional orientativa personalizada com rotina e metas.",
    longDescription:
      "IA orientativa. Não é consulta humana de nutrição clínica e não prescreve dieta terapêutica.",
    capabilityId: "ecconutri.assessment",
    promptVersion: "ecconutri-v1",
    billingType: "SUBSCRIPTION",
    usageLimit: 4,
    unitLabel: "plano de 30 dias",
    included: ["Plano nutricional orientativo PDF", "Planilha de rotina", "Metas", "Sugestão de produtos reais do marketplace"],
    avgFillMinutes: 10,
    maxImages: 2,
    maxFiles: null,
    hasWorkbook: true,
    reportTitle: "Plano Nutricional Orientativo EccoNutri AI",
    workbookTitle: "Rotina EccoNutri",
    forWhom: ["Ajustar rotina alimentar", "Controlar petiscos e hidratação"],
    howItWorks: HOW,
    limitations: ["Não prescreve dieta terapêutica", "Não substitui nutricionista veterinário"],
    exampleResult: "Resumo nutricional, rotina sugerida e pontos de atenção.",
    workspaceKind: "nutri",
    priceSource: "DOCUMENT",
    priceReference: "AI-T04",
    sourceSection: "AI-T04 — Routine Coach — R$ 14,90/tutor/mês",
  }),
  p({
    sku: AI_COMMERCE_SKUS.PESO,
    slug: "peso",
    name: "EccoPeso AI",
    tag: "Acompanhamento de peso",
    category: "Acompanhamento",
    group: "acompanhamento",
    filters: ["Todos", "Peso"],
    shortDescription: "Histórico de peso, tendência, meta e relatório de evolução.",
    longDescription: "Acompanhamento longitudinal. Foto opcional para condição corporal orientativa, sem precisão clínica afirmada.",
    capabilityId: "eccopeso.assessment",
    promptVersion: "eccopeso-v1",
    billingType: "SUBSCRIPTION",
    usageLimit: 30,
    unitLabel: "plano de 30 dias",
    included: ["Dashboard de peso", "Variações 7/30/90 dias", "PDF de evolução", "Planilha"],
    avgFillMinutes: 4,
    maxImages: 2,
    maxFiles: null,
    hasWorkbook: true,
    reportTitle: "Relatório de Evolução EccoPeso",
    workbookTitle: "Histórico EccoPeso",
    extraFaqs: [
      {
        q: "De onde vem o preço?",
        a: "R$ 9,90/mês alinhado à faixa documental de balança/atividade. Não há SKU nominal EccoPeso na planilha oficial.",
      },
    ],
    forWhom: ["Acompanhar ganho ou perda de peso", "Registrar meta com o veterinário"],
    howItWorks: HOW,
    limitations: ["Não afirma escore corporal clínico sem validação"],
    exampleResult: "Peso atual, tendência, meta e observações.",
    workspaceKind: "peso",
    priceSource: "DOCUMENT_DERIVED",
    priceReference: "AI-T08",
    sourceSection: "Balança/atividade — R$ 9,90/mês (SKU nominal não encontrado; faixa mensal documentada AI-T03/AI-T08).",
  }),
  p({
    sku: AI_COMMERCE_SKUS.DENTAL,
    slug: "dental",
    name: "EccoDental AI",
    tag: "Análise visual odontológica",
    category: "Análise",
    group: "analise",
    filters: ["Todos", "Imagem"],
    shortDescription: "Análise visual preliminar da boca e dos dentes a partir de fotos.",
    longDescription: "Não é odontograma clínico oficial. Não incentiva manipulação perigosa da boca do animal.",
    capabilityId: "eccodental.vision",
    promptVersion: "eccodental-vision-v1",
    billingType: "ONE_TIME",
    usageLimit: 1,
    unitLabel: "por análise",
    included: ["Fotos frontal/laterais", "Achados aparentes", "Mapa visual simplificado", "PDF"],
    avgFillMinutes: 6,
    maxImages: 4,
    maxFiles: null,
    hasWorkbook: false,
    reportTitle: "Relatório Visual EccoDental AI",
    extraFaqs: [{ q: "Preciso abrir a boca do pet?", a: "Somente se for seguro. Nunca force. Fotos espontâneas também ajudam." }],
    forWhom: ["Observar tártaro aparente, gengiva visível ou fraturas visíveis"],
    howItWorks: HOW,
    limitations: ["Não é odontograma oficial", "Não diagnostica doença periodontal"],
    exampleResult: "Resumo visual, áreas para observar e quando procurar atendimento.",
    workspaceKind: "dental",
    priceSource: "DOCUMENT_DERIVED",
    priceReference: "AI-T13",
    sourceSection: "Preço derivado da categoria de análise multimodal/evento (AI-T13).",
  }),
  p({
    sku: AI_COMMERCE_SKUS.BEHAVIOR,
    slug: "behavior",
    name: "EccoBehavior AI",
    tag: "Comportamento orientativo",
    category: "Acompanhamento",
    group: "acompanhamento",
    filters: ["Todos", "Comportamento"],
    shortDescription: "Avaliação comportamental estruturada com plano semanal orientativo.",
    longDescription: "IA comportamental orientativa. Não confundir com consulta clínica humana de comportamento.",
    capabilityId: "eccobehavior.assessment",
    promptVersion: "eccobehavior-v1",
    billingType: "SUBSCRIPTION",
    usageLimit: 4,
    unitLabel: "plano de 30 dias",
    included: ["Perfil informado", "Plano semanal XLSX", "Check-in de progresso", "PDF"],
    avgFillMinutes: 12,
    maxImages: 2,
    maxFiles: null,
    hasWorkbook: true,
    reportTitle: "Avaliação EccoBehavior AI",
    workbookTitle: "Plano Semanal EccoBehavior",
    forWhom: ["Ansiedade, latidos, adaptação, filhote, mudança de ambiente"],
    howItWorks: HOW,
    limitations: ["Não substitui adestrador ou veterinário comportamentalista"],
    exampleResult: "Padrões, gatilhos, plano e sinais para procurar profissional.",
    workspaceKind: "behavior",
    priceSource: "DOCUMENT",
    priceReference: "AI-T04",
    sourceSection: "AI-T04 — Routine Coach — R$ 14,90/tutor/mês",
  }),
  p({
    sku: AI_COMMERCE_SKUS.VACCINE,
    slug: "vacina",
    name: "EccoVacina AI",
    tag: "Carteira vacinal",
    category: "Acompanhamento",
    group: "acompanhamento",
    filters: ["Todos", "Vacinas"],
    shortDescription: "Carteira, calendário, comprovantes e alertas de doses.",
    longDescription: "Organiza o que foi informado. Nunca inventa que uma vacina foi administrada.",
    capabilityId: "eccovacina.plan",
    promptVersion: "eccovacina-v1",
    billingType: "SUBSCRIPTION",
    usageLimit: 12,
    unitLabel: "plano de 30 dias",
    included: ["Carteira digital PDF", "OCR de comprovante com confirmação", "Alertas configuráveis", "Calendário"],
    avgFillMinutes: 8,
    maxImages: 4,
    maxFiles: 4,
    hasWorkbook: true,
    reportTitle: "Carteira Vacinal Digital EccoPet",
    workbookTitle: "Calendário EccoVacina",
    extraFaqs: [{ q: "É certificação oficial?", a: "Não. É organização do que você cadastrou, com comprovantes." }],
    forWhom: ["Manter carteira organizada", "Lembrar próximas doses"],
    howItWorks: HOW,
    limitations: ["Não certifica vacinação", "Não inventa doses"],
    exampleResult: "Aplicadas, próximas, pendentes e sem informação suficiente.",
    workspaceKind: "vaccine",
    priceSource: "DOCUMENT_DERIVED",
    priceReference: "AI-T04",
    sourceSection: "Produto recorrente de organização (carteira/calendário). Preço derivado de AI-T04.",
  }),
  p({
    sku: AI_COMMERCE_SKUS.MED,
    slug: "med",
    name: "EccoMed AI",
    tag: "Medicamentos",
    category: "Acompanhamento",
    group: "acompanhamento",
    filters: ["Todos", "Medicamentos"],
    shortDescription: "Organiza tratamentos existentes, horários e adesão — sem prescrever.",
    longDescription: "Não aumenta, diminui, suspende nem substitui medicamento. Apenas organiza o que já foi prescrito.",
    capabilityId: "eccomed.review",
    promptVersion: "eccomed-v1",
    billingType: "ONE_TIME",
    usageLimit: 1,
    unitLabel: "por análise",
    included: ["Plano de medicamentos PDF", "Planilha de horários", "OCR com confirmação", "Lembretes"],
    avgFillMinutes: 8,
    maxImages: 4,
    maxFiles: 4,
    hasWorkbook: true,
    reportTitle: "Plano de Medicamentos EccoMed",
    workbookTitle: "Horários EccoMed",
    extraFaqs: [{ q: "A IA pode mudar a dose?", a: "Não. Apenas organiza a dose prescrita informada por você." }],
    forWhom: ["Tratamentos em andamento", "Múltiplos horários"],
    howItWorks: HOW,
    limitations: ["Não prescreve", "Não altera dose", "Não substitui medicamento"],
    exampleResult: "Lista organizada, horários e pontos de adesão.",
    workspaceKind: "med",
    priceSource: "DOCUMENT",
    priceReference: "AI-T11",
    sourceSection: "AI-T11 — Assistente de medicamentos — R$ 9,90/evento",
  }),
  p({
    sku: AI_COMMERCE_SKUS.CHECKUP,
    slug: "checkup",
    name: "EccoCheckup AI",
    tag: "Check-up digital",
    category: "Avaliação",
    group: "avaliacao",
    filters: ["Todos", "Avaliação"],
    shortDescription: "Questionário inteligente da rotina, prevenção e sinais do pet.",
    longDescription:
      "Fluxo progressivo. O Índice de Acompanhamento EccoPet é interno e não é índice clínico validado.",
    capabilityId: "eccocheckup.assessment",
    promptVersion: "eccocheckup-v1",
    billingType: "SUBSCRIPTION",
    usageLimit: 2,
    unitLabel: "plano de 30 dias",
    included: ["Questionário adaptativo", "Dashboard", "Relatório completo PDF", "Planilha de áreas"],
    avgFillMinutes: 12,
    maxImages: null,
    maxFiles: null,
    hasWorkbook: true,
    reportTitle: "EccoCheckup AI — Relatório Completo",
    workbookTitle: "Acompanhamento EccoCheckup",
    forWhom: ["Panorama periódico da rotina", "Preparar check-up presencial"],
    howItWorks: HOW,
    limitations: ["Não é exame clínico", "Índice interno não validado medicamente"],
    exampleResult: "Visão geral, prioridades, o que acompanhar e próximos passos.",
    workspaceKind: "checkup",
    priceSource: "DOCUMENT_DERIVED",
    priceReference: "AI-T02",
    sourceSection: "Base Care Navigator / acompanhamento inteligente (AI-T02). SKU nominal Checkup não existia.",
  }),
  p({
    sku: AI_COMMERCE_SKUS.HEALTH_PROFILE,
    slug: "health-profile",
    name: "Pet Health Profile",
    tag: "Dossiê inteligente",
    category: "Documentos e histórico",
    group: "documentos",
    filters: ["Todos", "Documentos"],
    shortDescription: "Ativação do prontuário inteligente do pet — peso, vacinas, exames e avaliações em um só lugar.",
    longDescription:
      "Organização inicial do dossiê. Depois de ativado, o perfil persiste e novas compras EccoPet AI alimentam a timeline.",
    capabilityId: "pethealth.profile",
    promptVersion: "pethealth-profile-v1",
    billingType: "ACTIVATION",
    usageLimit: 1,
    unitLabel: "ativação",
    included: ["Dossiê persistente", "Timeline", "PDF completo", "Exportação XLSX"],
    avgFillMinutes: 8,
    maxImages: 4,
    maxFiles: 8,
    hasWorkbook: true,
    reportTitle: "Pet Health Profile",
    workbookTitle: "Exportação Pet Health Profile",
    extraFaqs: [{ q: "Preciso comprar de novo?", a: "A ativação persiste. Novas ferramentas alimentam o mesmo perfil." }],
    forWhom: ["Quem quer um prontuário organizado do animal"],
    howItWorks: HOW,
    limitations: ["Não é prontuário clínico oficial de clínica"],
    exampleResult: "Resumo, abas de peso/vacinas/exames e linha do tempo.",
    workspaceKind: "profile",
    priceSource: "DOCUMENT",
    priceReference: "SAU-011",
    sourceSection: "SAU-011 — Organização de prontuário — R$ 49,90",
  }),
];

export const AI_STORE_GROUPS: Array<{ id: AiStoreGroup; label: string }> = [
  { id: "avaliacao", label: "Avaliação" },
  { id: "analise", label: "Análise" },
  { id: "acompanhamento", label: "Acompanhamento" },
  { id: "documentos", label: "Documentos e histórico" },
];

export const AI_STORE_FILTERS = [
  "Todos",
  "Avaliação",
  "Exames",
  "Imagem",
  "Nutrição",
  "Peso",
  "Comportamento",
  "Vacinas",
  "Medicamentos",
  "Documentos",
] as const;

export function getProductDefBySku(sku: string): AiCommerceProductDef | undefined {
  const canonical = canonicalAiCommerceSku(sku);
  return AI_COMMERCE_PRODUCTS.find((p) => p.sku === canonical);
}

export function getProductDefBySlug(slug: string): AiCommerceProductDef | undefined {
  const normalized = slug === "lab" ? "exames" : slug;
  return AI_COMMERCE_PRODUCTS.find((p) => p.slug === normalized);
}

export const URGENCY_LABELS: Record<string, string> = {
  ROUTINE: "Acompanhamento",
  MONITOR: "Avaliação recomendada",
  SOON: "Avaliação breve",
  URGENT: "Atendimento urgente",
  EMERGENCY: "Atendimento imediato",
};

export function isRecurringSku(sku: string): boolean {
  return getProductDefBySku(sku)?.billingType === "SUBSCRIPTION";
}

export function isActivationSku(sku: string): boolean {
  return getProductDefBySku(sku)?.billingType === "ACTIVATION";
}

export function durationCopy(def: AiCommerceProductDef): string {
  if (def.billingType === "SUBSCRIPTION") {
    return `Acesso por 30 dias, com até ${def.usageLimit} utilizações. Renovação manual — não há cobrança automática.`;
  }
  if (def.billingType === "ACTIVATION") {
    return "Ativação permanente. O perfil persiste e novas compras alimentam o histórico.";
  }
  return `${def.usageLimit} utilização. Sem recorrência.`;
}

export function purchaseCta(def: Pick<AiCommerceProductDef, "billingType">): string {
  if (def.billingType === "SUBSCRIPTION") return "Comprar plano de 30 dias";
  if (def.billingType === "ACTIVATION") return "Ativar perfil";
  return "Comprar agora";
}

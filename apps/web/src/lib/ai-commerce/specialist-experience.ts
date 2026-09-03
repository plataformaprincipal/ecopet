import { AI_COMMERCE_SKUS, type AiCommerceSku } from "./flags";
import { getProductDefBySku } from "./catalog";
import { getSpecialistProtocol } from "./specialist-protocols";

export type SpecialistAccent =
  | "vet"
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

export type SpecialistExperience = {
  sku: AiCommerceSku;
  accent: SpecialistAccent;
  accentColor: string;
  heroTitle: string;
  heroBody: string;
  whatItDoes: string;
  estimatedMinutes: number;
  composerPlaceholder: string;
  quickChips: string[];
  acceptedInputs: string[];
  resultEmphasis: string[];
  historyLabel: string;
};

const EXPERIENCES: Record<AiCommerceSku, Omit<SpecialistExperience, "sku">> = {
  AI_ECCOVET: {
    accent: "vet",
    accentColor: "#0F8A5F",
    heroTitle: "Converse sobre a saúde do seu pet.",
    heroBody: "Especialista geral. Uma pergunta por vez, com o histórico do pet já carregado.",
    whatItDoes: "Organiza a queixa, aprofunda o que falta e devolve uma impressão assistida para decidir o próximo passo.",
    estimatedMinutes: 8,
    composerPlaceholder: "O que está acontecendo hoje?",
    quickChips: [
      "Meu pet está estranho",
      "Sintomas",
      "Prevenção",
      "Alimentação",
      "Medicamentos",
      "Exames",
      "Quando procurar veterinário?",
    ],
    acceptedInputs: ["texto", "chips", "fotos opcionais", "PDF opcional"],
    resultEmphasis: ["Resumo", "Possíveis contextos", "Sinais de atenção", "O que observar", "Próximo passo"],
    historyLabel: "Avaliações anteriores",
  },
  AI_ECCOVET_TRIAGE: {
    accent: "triage",
    accentColor: "#C43B4B",
    heroTitle: "Descubra o nível de urgência em poucos minutos.",
    heroBody: "Triagem rápida. Se houver red flag, a entrevista para na hora.",
    whatItDoes: "Classifica VERDE / AMARELO / LARANJA / VERMELHO e diz o que fazer agora.",
    estimatedMinutes: 3,
    composerPlaceholder: "Qual o sinal mais urgente agora?",
    quickChips: ["Iniciar triagem", "Dificuldade para respirar", "Convulsão", "Sangramento", "Não consegue urinar"],
    acceptedInputs: ["chips de rastreio rápido"],
    resultEmphasis: ["Nível", "Por quê", "Sinal que gerou", "Prazo", "O que não fazer"],
    historyLabel: "Triagens anteriores",
  },
  AI_ECCOVET_REPORT: {
    accent: "report",
    accentColor: "#3B6B8C",
    heroTitle: "Crie um relatório completo do seu pet.",
    heroBody: "Documentalista clínico. Junta Health Profile, exames e análises em um documento para a consulta.",
    whatItDoes: "Gera preview profissional com proveniência (tutor / documento / IA) e PDF.",
    estimatedMinutes: 6,
    composerPlaceholder: "Para quem será este relatório?",
    quickChips: ["Saúde", "Histórico", "Consulta", "Viagem", "Para veterinário"],
    acceptedInputs: ["tipo de relatório", "período", "documentos opcionais"],
    resultEmphasis: ["Identificação", "Linha do tempo", "Vacinação", "Exames", "Perguntas para a consulta"],
    historyLabel: "Relatórios anteriores",
  },
  AI_ECCOVET_EXAMS: {
    accent: "exams",
    accentColor: "#2B6CB0",
    heroTitle: "Envie o exame do seu pet.",
    heroBody: "Explicação estruturada de PDF ou foto. Sem inventar referência ausente.",
    whatItDoes: "Extrai marcadores, destaca alterações e prepara perguntas para o veterinário.",
    estimatedMinutes: 5,
    composerPlaceholder: "Anexe o PDF ou a foto do exame…",
    quickChips: ["Hemograma", "Bioquímica", "Urina", "Comparar com exame anterior"],
    acceptedInputs: ["PDF", "JPEG", "PNG", "WEBP"],
    resultEmphasis: ["Tabela", "Alterações importantes", "Padrões", "O que correlacionar"],
    historyLabel: "Exames analisados",
  },
  AI_ECCOVET_VISION: {
    accent: "vision",
    accentColor: "#6B4C9A",
    heroTitle: "Mostre o que está acontecendo.",
    heroBody: "Análise visual orientativa. Primeiro a qualidade da foto; depois o que é possível afirmar.",
    whatItDoes: "Descreve o visível, o que a foto não permite concluir e quando reavaliar.",
    estimatedMinutes: 4,
    composerPlaceholder: "Descreva a região ou envie a foto…",
    quickChips: ["Pele", "Olhos", "Ouvidos", "Boca", "Ferimento", "Fezes", "Outro"],
    acceptedInputs: ["foto", "região", "chips de contexto"],
    resultEmphasis: ["O que consigo ver", "O que não dá para afirmar", "Nível de atenção"],
    historyLabel: "Fotos analisadas",
  },
  AI_ECCONUTRI: {
    accent: "nutri",
    accentColor: "#D97706",
    heroTitle: "Alimentação personalizada para seu pet.",
    heroBody: "RER e MER vêm do servidor. A IA só traduz o cálculo em rotina compreensível.",
    whatItDoes: "Avalia dieta atual, energia estimada, petiscos e transição — sem dieta terapêutica inventada.",
    estimatedMinutes: 8,
    composerPlaceholder: "Qual é o objetivo com a alimentação?",
    quickChips: ["Manutenção", "Perder peso", "Ganhar peso", "Revisar dieta atual"],
    acceptedInputs: ["objetivo", "alimento", "gramas", "rótulo opcional"],
    resultEmphasis: ["RER/MER", "Porções", "Petiscos", "Produtos reais do marketplace"],
    historyLabel: "Planos alimentares",
  },
  AI_ECCOPESO: {
    accent: "peso",
    accentColor: "#2563EB",
    heroTitle: "Peso saudável, acompanhamento contínuo.",
    heroBody: "Números reais do histórico: variação, tendência e check-ins semanais.",
    whatItDoes: "Mostra status, meta e ritmo. Não inventa escore clínico.",
    estimatedMinutes: 4,
    composerPlaceholder: "Qual o peso atual, em kg?",
    quickChips: ["Registrar peso", "Ver tendência", "Criar acompanhamento"],
    acceptedInputs: ["peso", "BCS visual", "atividade"],
    resultEmphasis: ["Peso atual", "Variação %", "Tendência", "Check-in"],
    historyLabel: "Acompanhamentos de peso",
  },
  AI_ECCODENTAL: {
    accent: "dental",
    accentColor: "#0D9488",
    heroTitle: "Cuide da boca e dos dentes do seu pet.",
    heroBody: "Avaliação oral visual. Sem estágio periodontal definitivo por foto.",
    whatItDoes: "Mapa oral, hábitos seguros e quando buscar avaliação profissional.",
    estimatedMinutes: 5,
    composerPlaceholder: "Há mau hálito, sangramento ou dor?",
    quickChips: ["Mau hálito", "Tártaro", "Dificuldade para comer", "Enviar foto"],
    acceptedInputs: ["questionário", "fotos frontal/lados se seguro"],
    resultEmphasis: ["Mapa oral", "Tártaro visual", "Cuidados domiciliares"],
    historyLabel: "Avaliações orais",
  },
  AI_ECCOBEHAVIOR: {
    accent: "behavior",
    accentColor: "#7C3AED",
    heroTitle: "Entenda melhor o comportamento do seu pet.",
    heroBody: "Especialista em comportamento. Constrói ABC — antecedente, comportamento, consequência.",
    whatItDoes: "Identifica gatilhos, manejo ambiental e métricas de progresso.",
    estimatedMinutes: 10,
    composerPlaceholder: "Qual comportamento você quer entender?",
    quickChips: ["Ansiedade", "Agressividade", "Latidos", "Medo", "Destruição", "Xixi fora do lugar", "Adaptação", "Socialização"],
    acceptedInputs: ["tipo", "ABC", "frequência"],
    resultEmphasis: ["Padrão ABC", "Gatilhos", "Plano de manejo", "Métricas"],
    historyLabel: "Avaliações comportamentais",
  },
  AI_ECCOVACCINE: {
    accent: "vaccine",
    accentColor: "#1D4ED8",
    heroTitle: "Carteira vacinal inteligente.",
    heroBody: "O calendário vem de vaccination-rules. A IA não inventa dose.",
    whatItDoes: "Mostra realizadas, próximas, atrasadas e o que está sem registro suficiente.",
    estimatedMinutes: 5,
    composerPlaceholder: "A carteira está em foto, PDF ou já no histórico?",
    quickChips: ["Foto da carteira", "Informar manualmente", "Ver pendências"],
    acceptedInputs: ["foto/PDF", "registro manual", "estilo de vida"],
    resultEmphasis: ["Timeline", "Status", "Próxima ação"],
    historyLabel: "Carteiras revisadas",
  },
  AI_ECCOMED: {
    accent: "med",
    accentColor: "#E11D48",
    heroTitle: "Organize os medicamentos do seu pet.",
    heroBody: "Revisor farmacológico. Não prescreve e não inventa dose.",
    whatItDoes: "Organiza o que já foi orientado, calcula mg/kg só com dose documentada e alerta ingestão acidental.",
    estimatedMinutes: 5,
    composerPlaceholder: "Qual medicamento foi prescrito?",
    quickChips: ["Receita", "Foto da caixa", "Organizar horários", "Ingestão acidental"],
    acceptedInputs: ["receita/foto", "dose escrita", "frequência"],
    resultEmphasis: ["Identificação", "Horários", "Pontos a confirmar"],
    historyLabel: "Revisões medicamentosas",
  },
  AI_ECCOCHECKUP: {
    accent: "checkup",
    accentColor: "#059669",
    heroTitle: "Veja como está a rotina de prevenção do seu pet.",
    heroBody: "Check-up em blocos curtos. Top 3 prioridades deste animal — não uma lista genérica.",
    whatItDoes: "Score por sistema (peso, vacinas, dental, nutrição, comportamento, exames).",
    estimatedMinutes: 8,
    composerPlaceholder: "Como estão energia e apetite hoje?",
    quickChips: ["Peso", "Vacinas", "Dental", "Nutrição", "Comportamento", "Exames"],
    acceptedInputs: ["blocos preventivos"],
    resultEmphasis: ["Checklist", "Em dia / atenção / pendente", "Top 3"],
    historyLabel: "Check-ups anteriores",
  },
  AI_PET_HEALTH_PROFILE: {
    accent: "profile",
    accentColor: "#6D28D9",
    heroTitle: "Memória inteligente da saúde do seu pet.",
    heroBody: "Pergunte qualquer coisa sobre o histórico. Cada fato traz a origem.",
    whatItDoes: "Timeline longitudinal: vacinas, peso, exames, medicações, análises de IA.",
    estimatedMinutes: 3,
    composerPlaceholder: "Pergunte sobre o histórico do seu pet…",
    quickChips: [
      "Quando foi a última vacina?",
      "Como o peso mudou?",
      "Resuma os últimos exames",
      "Quais cuidados estão pendentes?",
    ],
    acceptedInputs: ["pergunta sobre o prontuário"],
    resultEmphasis: ["Timeline", "Tendências", "Pendências", "Fontes"],
    historyLabel: "Consultas ao histórico",
  },
};

export function getSpecialistExperience(sku: string): SpecialistExperience | undefined {
  const spec = EXPERIENCES[sku as AiCommerceSku];
  if (!spec) return undefined;
  return { sku: sku as AiCommerceSku, ...spec };
}

export function listSpecialistExperiences(): SpecialistExperience[] {
  return Object.keys(EXPERIENCES).map((sku) => getSpecialistExperience(sku)!);
}

export function specialistRegistryRow(sku: string) {
  const def = getProductDefBySku(sku);
  const protocol = getSpecialistProtocol(sku);
  const experience = getSpecialistExperience(sku);
  if (!def || !protocol || !experience) return null;
  return {
    id: def.sku,
    slug: def.slug,
    name: def.name,
    capabilityId: def.capabilityId,
    sku: def.sku,
    category: def.category,
    description: experience.whatItDoes,
    shortBenefit: def.shortDescription,
    estimatedMinutes: experience.estimatedMinutes,
    acceptedInputs: experience.acceptedInputs,
    protocol: protocol.capabilityId,
    analysisInstructions: protocol.analysisInstructions.slice(0, 80),
    minimumData: protocol.minimumData,
    resultRenderer: experience.accent,
    priceSource: def.priceSource,
    entitlementType: def.billingType,
    ctaLabel: def.ctaLabel,
    specialistTitle: protocol.specialistTitle,
  };
}

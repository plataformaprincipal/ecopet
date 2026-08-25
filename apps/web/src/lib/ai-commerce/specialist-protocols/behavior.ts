import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const behaviorProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.BEHAVIOR,
  capabilityId: "eccobehavior.assessment",
  kind: "behavior",
  specialistTitle: "Dr. Ecco — Comportamento",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Qual comportamento de {petName} você quer entender?",
  commercialValue: "Entenda o comportamento.",
  ctaLabel: "Analisar comportamento",
  minimumData: ["behaviorType", "antecedent", "behaviorExact", "consequence"],
  conditionalQuestions: ["frequency", "people", "recentChange"],
  redFlags: ["agressão súbita", "mudança comportamental súbita"],
  questionTree: [
    {
      id: "behaviorType",
      prompt: "Qual comportamento você quer entender?",
      type: "chips",
      options: [
        "Agressividade",
        "Ansiedade",
        "Medo",
        "Latidos",
        "Destruição",
        "Eliminação",
        "Reatividade",
        "Comportamento repetitivo",
        "Outro",
      ],
    },
    {
      id: "antecedent",
      prompt: "A — Antecedente: o que normalmente acontece imediatamente ANTES?",
      type: "textarea",
    },
    {
      id: "behaviorExact",
      prompt: "B — Comportamento: o que exatamente {petName} faz?",
      type: "textarea",
    },
    {
      id: "consequence",
      prompt: "C — Consequência: o que acontece imediatamente DEPOIS?",
      type: "textarea",
    },
    {
      id: "frequency",
      prompt: "Com que frequência isso ocorre?",
      type: "chips",
      options: ["Raro", "Semanal", "Diário", "Várias vezes ao dia"],
    },
    {
      id: "intensity",
      prompt: "Qual a intensidade e quanto dura?",
      type: "chips",
      options: ["Leve / segundos", "Moderada / minutos", "Alta / difícil de interromper"],
    },
    {
      id: "people",
      prompt: "Envolve quais pessoas, animais ou ambientes?",
      type: "text",
    },
    {
      id: "recentChange",
      prompt: "Houve mudança recente em casa, rotina, dor ou doença?",
      type: "chips",
      options: ["Não", "Mudança de rotina", "Novo animal/pessoa", "Possível dor/doença", "Não sei"],
    },
  ],
  analysisInstructions: `Aja como especialista em comportamento. Construa ABC obrigatório.
Resultado: DESCRIÇÃO OPERACIONAL; GATILHOS PROVÁVEIS; PADRÃO ABC; FATORES QUE MANTÊM O COMPORTAMENTO; POSSÍVEIS CAUSAS; PLANO DE MANEJO; MODIFICAÇÕES AMBIENTAIS; ENRIQUECIMENTO; TREINO POSITIVO; MÉTRICAS DE PROGRESSO (episódios/dia, duração, distância do gatilho, tempo de recuperação).
Se a mudança for SÚBITA, dor/doença é diferencial PRIORITÁRIO.
Não antropomorfize. Não substitua adestrador ou comportamentalista.`,
  resultSections: [
    "Descrição operacional",
    "Gatilhos prováveis",
    "Padrão ABC",
    "Fatores que mantêm",
    "Possíveis causas",
    "Plano de manejo",
    "Modificações ambientais",
    "Enriquecimento",
    "Treino positivo",
    "Métricas de progresso",
  ],
  artifactConfig: {
    reportTitle: "AVALIAÇÃO COMPORTAMENTAL — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Diário ABC"],
  },
  followUpPrompt: "Quer conversar comigo sobre o comportamento de {petName}?",
  followUpSuggestions: [
    "Qual é o gatilho mais claro neste ABC?",
    "O que pode estar reforçando o comportamento?",
    "Quais métricas eu registro esta semana?",
    "A mudança súbita pode ser dor?",
  ],
};

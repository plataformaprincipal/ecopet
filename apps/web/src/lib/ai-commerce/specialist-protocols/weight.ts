import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const weightProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.PESO,
  capabilityId: "eccopeso.assessment",
  kind: "peso",
  specialistTitle: "Dr. Ecco — Controle de Peso",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Vamos olhar o peso de {petName} com números, não com achismo.",
  commercialValue: "Acompanhe peso e condição corporal.",
  ctaLabel: "Avaliar peso",
  minimumData: ["weight"],
  conditionalQuestions: ["ribs", "waist", "abdomen"],
  redFlags: [],
  questionTree: [
    {
      id: "weight",
      prompt: "Qual o peso atual de {petName}, em kg?",
      type: "text",
      skipIfKnown: "weight",
      confirmIfKnown: true,
    },
    {
      id: "ribs",
      prompt: "As costelas de {petName} são fáceis de sentir, sem apertar?",
      type: "chips",
      options: ["Muito fáceis / salientes", "Fáceis com leve toque", "Preciso pressionar", "Não sinto"],
    },
    {
      id: "waist",
      prompt: "Visto de cima, {petName} tem cintura visível?",
      type: "chips",
      options: ["Cintura marcada", "Cintura discreta", "Reta", "Mais largo no meio"],
    },
    {
      id: "abdomen",
      prompt: "De lado, o abdômen de {petName}:",
      type: "chips",
      options: ["Recolhido", "Reto", "Pendular"],
    },
    {
      id: "activity",
      prompt: "A atividade recente de {petName} está:",
      type: "chips",
      options: ["Baixa", "Moderada", "Alta", "Caiu ultimamente"],
    },
    {
      id: "goal",
      prompt: "Qual a meta com o peso de {petName}?",
      type: "chips",
      options: ["Manter", "Reduzir", "Aumentar", "Ainda não definida"],
    },
  ],
  analysisInstructions: `Módulo QUANTITATIVO. Os cálculos (delta, %, tendência) vêm do servidor em weightMath. NÃO recalcule diferente.
NÃO diga apenas "acima do peso". Relate: PESO ATUAL; VARIAÇÃO EM X DIAS; VARIAÇÃO %; BCS ESTIMADO (1–9, orientativo); TENDÊNCIA; META; FAIXA DE MONITORAMENTO; VELOCIDADE DE MUDANÇA; CHECK-IN.
Exemplo de linguagem: "{nome} passou de 7,8 kg para 7,2 kg em 8 semanas, redução de 7,7%."
BCS é estimativa visual/relato, não escore clínico certificado.`,
  resultSections: [
    "Peso atual",
    "Variação",
    "Variação %",
    "BCS estimado",
    "Tendência",
    "Meta",
    "Faixa de monitoramento",
    "Velocidade de mudança",
    "Check-in",
  ],
  artifactConfig: {
    reportTitle: "RELATÓRIO DE EVOLUÇÃO DE PESO — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Medições", "Tendência"],
  },
  followUpPrompt: "Quer conversar comigo sobre o peso de {petName}?",
  followUpSuggestions: [
    "Essa variação é rápida ou segura?",
    "Qual faixa eu deveria monitorar nas próximas 4 semanas?",
    "O BCS estimado mudou em relação ao histórico?",
    "Quando registrar o próximo peso?",
  ],
};

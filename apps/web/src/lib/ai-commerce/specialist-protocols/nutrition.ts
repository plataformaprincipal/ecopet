import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const nutritionProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.NUTRI,
  capabilityId: "ecconutri.assessment",
  kind: "nutri",
  specialistTitle: "Dr. Ecco — Nutrição",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Qual é seu objetivo com a alimentação de {petName}?",
  commercialValue: "Revise a alimentação.",
  ctaLabel: "Avaliar alimentação",
  minimumData: ["goal", "currentFood"],
  conditionalQuestions: ["kcalLabel", "treats", "humanFood"],
  redFlags: [],
  questionTree: [
    {
      id: "goal",
      prompt: "Qual é seu objetivo com a alimentação de {petName}?",
      type: "chips",
      options: [
        "Manutenção",
        "Perder peso",
        "Ganhar peso",
        "Melhorar qualidade da dieta",
        "Organizar horários",
        "Transição",
        "Revisar dieta atual",
      ],
    },
    {
      id: "weight",
      prompt: "Qual o peso atual de {petName}, em kg?",
      type: "text",
      skipIfKnown: "weight",
      confirmIfKnown: true,
    },
    {
      id: "idealWeight",
      prompt: "Existe um peso ideal já combinado com o veterinário?",
      type: "text",
    },
    {
      id: "bcs",
      prompt: "Olhando {petName}, as costelas são fáceis de sentir e há cintura vista de cima?",
      type: "chips",
      options: ["Muito magro", "Magro", "Ideal", "Sobrepeso", "Obeso", "Não sei"],
    },
    {
      id: "activity",
      prompt: "Qual o nível de atividade de {petName}?",
      type: "chips",
      options: ["Baixa", "Moderada", "Alta"],
    },
    {
      id: "currentFood",
      prompt: "Qual alimento {petName} come hoje (marca/tipo)?",
      type: "textarea",
      skipIfKnown: "diet",
      confirmIfKnown: true,
    },
    {
      id: "gramsPerDay",
      prompt: "Quantos gramas por dia, e em quantas refeições?",
      type: "text",
    },
    {
      id: "kcalLabel",
      prompt: "O rótulo informa kcal? Se não souber, envie foto do rótulo.",
      type: "text",
    },
    {
      id: "labelPhoto",
      prompt: "Foto do rótulo, se quiser que eu extraia a energia.",
      type: "upload",
      uploadKind: "vision",
      accept: "image/jpeg,image/png,image/webp",
    },
    {
      id: "treats",
      prompt: "{petName} recebe petiscos ou comida humana?",
      type: "chips",
      options: ["Não", "Petiscos", "Comida humana", "Os dois"],
    },
    {
      id: "water",
      prompt: "Como está o consumo de água?",
      type: "chips",
      options: ["Normal", "Bebe pouco", "Bebe muito", "Não sei"],
    },
  ],
  analysisInstructions: `Aja como nutricionista veterinário digital. NÃO formule dieta terapêutica.
O servidor já calcula RER = 70 × pesoKg^0.75 e MER com fator configurado. NÃO invente fator nem recalcule diferente.
Mostre o cálculo quando o energyMath vier no contexto.
Se kcal do alimento estiver ausente, NÃO finja precisão em gramas.
Resultado: AVALIAÇÃO NUTRICIONAL; INGESTÃO ATUAL ESTIMADA; NECESSIDADE ENERGÉTICA ESTIMADA; DIFERENÇA; DIVISÃO DE REFEIÇÕES; PETISCOS; ÁGUA; TRANSIÇÃO; METAS; MONITORAMENTO.
Use o nome do pet e o objetivo declarado.`,
  resultSections: [
    "Avaliação nutricional",
    "Ingestão atual estimada",
    "Necessidade energética estimada",
    "Diferença",
    "Divisão de refeições",
    "Petiscos",
    "Água",
    "Transição",
    "Metas",
    "Monitoramento",
  ],
  artifactConfig: {
    reportTitle: "AVALIAÇÃO NUTRICIONAL ORIENTATIVA — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Refeições", "Quantidades", "Calorias", "Peso semanal"],
  },
  followUpPrompt: "Quer conversar comigo sobre a alimentação de {petName}?",
  followUpSuggestions: [
    "Mostre de novo o cálculo de RER e MER.",
    "Como divido as refeições sem estourar as calorias?",
    "Os petiscos cabem nesta meta?",
    "Como fazer a transição em 7 dias?",
  ],
};

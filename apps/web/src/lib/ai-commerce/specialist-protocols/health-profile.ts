import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const healthProfileProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.HEALTH_PROFILE,
  capabilityId: "pethealth.profile",
  kind: "profile",
  specialistTitle: "Dr. Ecco — Histórico de Saúde",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Pergunte qualquer coisa sobre o histórico de {petName}.",
  commercialValue: "Tenha toda a saúde do pet em um único histórico.",
  ctaLabel: "Abrir Health Profile",
  minimumData: ["profileIntent"],
  conditionalQuestions: ["focusQuestion"],
  redFlags: [],
  questionTree: [
    {
      id: "profileIntent",
      prompt: "O que você quer ver no histórico de {petName}?",
      type: "chips",
      options: [
        "Gerar resumo completo",
        "Quanto pesava há seis meses?",
        "Quais alterações apareceram nos exames?",
        "Quais vacinas estão registradas?",
        "Quando começaram os episódios?",
        "Quais medicamentos já foram registrados?",
        "Outra pergunta",
      ],
    },
    {
      id: "focusQuestion",
      prompt: "Escreva a pergunta sobre o histórico de {petName}.",
      type: "textarea",
      when: (ctx) => ctx.answers.profileIntent === "Outra pergunta",
    },
  ],
  analysisInstructions: `Este é o prontuário inteligente. Toda afirmação precisa de proveniência interna.
Tipos: USER_REPORTED, DOCUMENT_EXTRACTED, SYSTEM_CALCULATED, AI_ANALYSIS. NUNCA misture.
Gere: RESUMO DO PET; CONDIÇÕES; MEDICAÇÕES; ALERGIAS; PESO; VACINAS; EXAMES; EPISÓDIOS; ANÁLISES IA; LINHA DO TEMPO.
Responda a pergunta do tutor com citação de origem. Se o dado não existir, diga que não há registro — não invente.
diagnosticImpression.status = NOT_APPLICABLE, salvo se houver achado clínico já documentado para resumir.`,
  resultSections: [
    "Resumo do pet",
    "Condições",
    "Medicações",
    "Alergias",
    "Peso",
    "Vacinas",
    "Exames",
    "Episódios",
    "Análises IA",
    "Linha do tempo",
  ],
  artifactConfig: {
    reportTitle: "HEALTH SUMMARY — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Linha do tempo", "Fontes"],
  },
  followUpPrompt: "Pergunte qualquer outra coisa sobre o histórico de {petName}.",
  followUpSuggestions: [
    "Quanto ele pesava há seis meses?",
    "Quais vacinas estão registradas de fato?",
    "Quais dados são relato e quais são documentais?",
    "Quais lacunas existem neste prontuário?",
  ],
};

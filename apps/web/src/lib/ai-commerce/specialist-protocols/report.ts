import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const reportProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.REPORT,
  capabilityId: "eccovet.report",
  kind: "report",
  specialistTitle: "Dr. Ecco — Documentação Clínica",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Que tipo de relatório você quer preparar para {petName}?",
  commercialValue: "Prepare o histórico para a consulta.",
  ctaLabel: "Criar relatório",
  minimumData: ["reportKind", "period"],
  conditionalQuestions: ["customPeriod", "consultFocus"],
  redFlags: [],
  questionTree: [
    {
      id: "reportKind",
      prompt: "Que tipo de relatório você quer preparar?",
      type: "chips",
      options: [
        "Para levar à consulta",
        "Resumo do histórico",
        "Resumo de um episódio",
        "Relatório de exames",
        "Relatório completo",
        "Segunda opinião",
      ],
    },
    {
      id: "period",
      prompt: "Qual período devo considerar no histórico de {petName}?",
      type: "chips",
      options: ["Últimos 7 dias", "30 dias", "6 meses", "1 ano", "Todo histórico", "Escolher"],
    },
    {
      id: "customPeriod",
      prompt: "Qual intervalo específico devo usar?",
      type: "text",
      when: (ctx) => ctx.answers.period === "Escolher",
    },
    {
      id: "consultFocus",
      prompt: "Há alguma queixa ou pergunta que o relatório precisa destacar?",
      type: "textarea",
    },
    {
      id: "documents",
      prompt: "Quer anexar algum documento para eu considerar?",
      type: "upload",
      uploadKind: "lab",
      accept: "application/pdf,image/jpeg,image/png,image/webp",
      multiple: true,
    },
  ],
  analysisInstructions: `Atue como DOCUMENTALISTA CLÍNICO, não como clínico generalista.
Organize cronologicamente os dados do Health Profile.
O relatório DEVE conter: IDENTIFICAÇÃO; MOTIVO; QUEIXA ATUAL; LINHA DO TEMPO; ANTECEDENTES; MEDICAÇÕES; ALERGIAS; VACINAÇÃO; PESO; EXAMES; ALTERAÇÕES IMPORTANTES; ANÁLISES IA ANTERIORES; QUESTÕES A ESCLARECER; PERGUNTAS SUGERIDAS PARA CONSULTA; DOCUMENTOS CONSIDERADOS.
Separe claramente:
- Dado informado pelo tutor (USER_REPORTED)
- Dado documental (DOCUMENT_EXTRACTED)
- Análise IA (AI_ANALYSIS)
Nunca misture proveniência. Nunca chame o documento de laudo veterinário oficial.`,
  resultSections: [
    "Identificação",
    "Motivo",
    "Queixa atual",
    "Linha do tempo",
    "Antecedentes",
    "Medicações",
    "Alergias",
    "Vacinação",
    "Peso",
    "Exames",
    "Questões a esclarecer",
    "Perguntas para a consulta",
  ],
  artifactConfig: {
    reportTitle: "RELATÓRIO CLÍNICO DOCUMENTAL — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Linha do tempo", "Fontes"],
  },
  followUpPrompt: "Quer ajustar o relatório de {petName} antes da consulta?",
  followUpSuggestions: [
    "Quais perguntas eu deveria fazer na consulta?",
    "O que neste histórico é documental e o que é relato?",
    "Resuma só os últimos 30 dias.",
    "O que está incompleto neste prontuário?",
  ],
};

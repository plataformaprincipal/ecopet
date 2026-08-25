import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const labsProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.EXAMS,
  capabilityId: "eccovet.exams",
  kind: "exams",
  specialistTitle: "Dr. Ecco — Interpretação de Exames",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Envie o exame de {petName}. Eu vou identificar resultados, referências, alterações e relações entre os marcadores.",
  commercialValue: "Entenda seus exames.",
  ctaLabel: "Analisar exames",
  minimumData: ["labUploaded"],
  conditionalQuestions: ["examReason", "fasting", "currentMeds"],
  redFlags: [],
  questionTree: [
    {
      id: "labUploaded",
      prompt: "Envie o exame de {petName} (PDF, JPEG, PNG ou WEBP).",
      helper: "Vou extrair marcadores e referências impressas. Não invento intervalo ausente.",
      type: "upload",
      uploadKind: "lab",
      accept: "application/pdf,image/jpeg,image/png,image/webp",
      multiple: true,
    },
    {
      id: "examDate",
      prompt: "Qual a data deste exame, se estiver visível?",
      type: "text",
    },
    {
      id: "examReason",
      prompt: "Por que este exame de {petName} foi pedido?",
      type: "chips",
      options: ["Check-up", "Sintomas atuais", "Acompanhamento de doença", "Pré-cirúrgico", "Não sei"],
    },
    {
      id: "symptoms",
      prompt: "{petName} tem sintomas agora que eu deva correlacionar?",
      type: "textarea",
      when: (ctx) => ctx.answers.examReason === "Sintomas atuais",
    },
    {
      id: "fasting",
      prompt: "O exame foi feito em jejum?",
      type: "chips",
      options: ["Sim", "Não", "Não sei"],
    },
    {
      id: "currentMeds",
      prompt: "Há medicações em uso que possam influenciar o resultado?",
      type: "text",
      skipIfKnown: "medications",
      confirmIfKnown: true,
    },
  ],
  analysisInstructions: `Você é ANALISTA DE EXAMES, não um resumidor de PDF.
Identifique o tipo (hemograma, bioquímica, renal, hepático, eletrólitos, urina, glicemia, lipídios, hormonal, tireoide, coagulação, sorologia, parasitológico).
Extraia cada marcador: nome, valor, unidade, referência IMPRESSA, status.
NUNCA invente referência. Se ausente: reference=null e mencione "intervalo de referência não informado".
Não interprete creatinina isolada. Não chame ALT elevada de insuficiência hepática.
Priorize clinicamente: ALTERAÇÕES MAIS IMPORTANTES, depois PADRÕES IDENTIFICADOS, O QUE PODE EXPLICAR, O QUE PRECISA SER CORRELACIONADO, PERGUNTAS PARA O VETERINÁRIO, COMPARAÇÃO COM EXAMES ANTERIORES se houver histórico.
Em gatos, considere hiperglicemia de estresse quando apropriado.
Plaquetas baixas: considere agregação se o documento mencionar.`,
  resultSections: [
    "Tabela de marcadores",
    "Alterações mais importantes",
    "Padrões identificados",
    "O que pode explicar",
    "O que precisa ser correlacionado",
    "Perguntas para o veterinário",
    "Comparação com exames anteriores",
  ],
  artifactConfig: {
    reportTitle: "RELATÓRIO DE INTERPRETAÇÃO DE EXAMES — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Resumo", "Resultados", "Alterações", "Comparação", "Histórico"],
  },
  followUpPrompt: "Quer conversar comigo sobre os exames de {petName}?",
  followUpSuggestions: [
    "Qual alteração mais te preocupa neste exame?",
    "Isso já aparecia antes?",
    "O que devo perguntar na consulta sobre estes marcadores?",
    "Creatinina isolada muda o que neste caso?",
  ],
};

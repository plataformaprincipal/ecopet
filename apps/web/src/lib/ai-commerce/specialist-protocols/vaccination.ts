import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const vaccinationProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.VACCINE,
  capabilityId: "eccovacina.plan",
  kind: "vaccine",
  specialistTitle: "Dr. Ecco — Medicina Preventiva",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Vamos organizar a carteira de {petName} com o que está registrado — sem inventar dose.",
  commercialValue: "Organize a carteira de vacinação.",
  ctaLabel: "Revisar vacinas",
  minimumData: ["cardSource"],
  conditionalQuestions: ["lifestyle", "name", "date"],
  redFlags: [],
  questionTree: [
    {
      id: "cardSource",
      prompt: "A carteira de {petName} está disponível?",
      type: "chips",
      options: ["Foto", "PDF", "Informar manualmente", "Já está no histórico"],
    },
    {
      id: "cardUpload",
      prompt: "Envie a foto ou o PDF da carteira.",
      type: "upload",
      uploadKind: "lab",
      accept: "application/pdf,image/jpeg,image/png,image/webp",
      multiple: true,
      when: (ctx) => ctx.answers.cardSource === "Foto" || ctx.answers.cardSource === "PDF",
    },
    {
      id: "name",
      prompt: "Qual o nome da vacina registrada?",
      type: "text",
      when: (ctx) => ctx.answers.cardSource === "Informar manualmente",
    },
    {
      id: "date",
      prompt: "Qual a data desta dose?",
      type: "text",
      when: (ctx) => ctx.answers.cardSource === "Informar manualmente",
    },
    {
      id: "batch",
      prompt: "Lote e fabricante, se legíveis.",
      type: "text",
      when: (ctx) => ctx.answers.cardSource === "Informar manualmente",
    },
    {
      id: "lifestyle",
      prompt: "Como é a vida de {petName} em relação a risco vacinal?",
      type: "checkboxes",
      options: ["Acesso à rua", "Hotel/creche", "Viagens", "Contato com outros animais", "Predominantemente indoor"],
    },
  ],
  analysisInstructions: `NÃO responda "qual vacina falta" só com o LLM.
O servidor aplica vaccination-rules para próxima dose. Sem data, nextDue = INSUFFICIENT_DATA. NUNCA invente vacinação não registrada.
Extraia: nome, data, dose, lote e fabricante quando legíveis.
Resultado: CARTEIRA IDENTIFICADA e tabela VACINA / ÚLTIMA DOSE / STATUS / PRÓXIMA AÇÃO / OBSERVAÇÃO.
Separe: REGISTRADA E ATUAL; PRÓXIMA DE VENCER; SEM REGISTRO SUFICIENTE; POSSIVELMENTE ATRASADA.
Contextualize por espécie, idade, estilo de vida. needsConfirmation=true em extrações.`,
  resultSections: [
    "Carteira identificada",
    "Registrada e atual",
    "Próxima de vencer",
    "Sem registro suficiente",
    "Possivelmente atrasada",
    "Próxima ação",
  ],
  artifactConfig: {
    reportTitle: "RESUMO VACINAL — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Carteira"],
  },
  followUpPrompt: "Quer conversar comigo sobre a carteira de {petName}?",
  followUpSuggestions: [
    "O que está de fato registrado?",
    "O que está sem data suficiente?",
    "Posso calcular a próxima dose sem inventar?",
    "Como adicionar um lembrete?",
  ],
};

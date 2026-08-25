import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const triageProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.TRIAGE,
  capabilityId: "eccovet.triage",
  kind: "triage",
  specialistTitle: "Dr. Ecco — Triagem e Urgência",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Vamos descobrir quão urgente é a situação de {petName}. Primeiro, um rastreio rápido.",
  commercialValue: "Descubra o nível de urgência.",
  ctaLabel: "Fazer triagem",
  minimumData: ["conscious", "breathingOk"],
  conditionalQuestions: ["bleeding", "standing", "seizing", "toxin", "trauma", "urineBlock", "retching", "distendedAbdomen", "extremePain"],
  redFlags: [
    "inconsciente",
    "não respira normalmente",
    "convulsionando",
    "não consegue urinar",
    "vômito improdutivo",
    "abdômen aumentado",
    "dor extrema",
    "trauma importante",
    "toxina",
  ],
  questionTree: [
    {
      id: "conscious",
      prompt: "{petName} está consciente?",
      type: "chips",
      options: ["Sim", "Sonolento", "Não responde"],
      redFlagValues: ["Não responde"],
      interruptOnRedFlag: true,
    },
    {
      id: "breathingOk",
      prompt: "{petName} respira normalmente?",
      type: "chips",
      options: ["Sim", "Esforço / boca aberta", "Quase não respira"],
      redFlagValues: ["Esforço / boca aberta", "Quase não respira"],
      interruptOnRedFlag: true,
    },
    {
      id: "bleeding",
      prompt: "Existe sangramento importante?",
      type: "chips",
      options: ["Não", "Sim, controlável", "Sim, intenso"],
      redFlagValues: ["Sim, intenso"],
      interruptOnRedFlag: true,
    },
    {
      id: "standing",
      prompt: "{petName} consegue ficar em pé?",
      type: "chips",
      options: ["Sim", "Com dificuldade", "Não"],
      redFlagValues: ["Não"],
      interruptOnRedFlag: true,
    },
    {
      id: "seizing",
      prompt: "{petName} está convulsionando agora ou teve convulsão recente?",
      type: "chips",
      options: ["Não", "Já passou", "Está convulsionando"],
      redFlagValues: ["Está convulsionando"],
      interruptOnRedFlag: true,
    },
    {
      id: "toxin",
      prompt: "{petName} pode ter ingerido toxina, medicamento humano ou produto químico?",
      type: "chips",
      options: ["Não", "Possível", "Sim, vi acontecer"],
      redFlagValues: ["Sim, vi acontecer"],
      interruptOnRedFlag: true,
    },
    {
      id: "trauma",
      prompt: "Houve trauma importante (atropelamento, queda, briga grave)?",
      type: "chips",
      options: ["Não", "Queda leve", "Trauma importante"],
      redFlagValues: ["Trauma importante"],
      interruptOnRedFlag: true,
    },
    {
      id: "urineBlock",
      prompt: "{petName} está tentando urinar sem conseguir?",
      type: "chips",
      options: ["Não", "Faz força e sai pouco", "Tenta e não produz"],
      redFlagValues: ["Tenta e não produz"],
      interruptOnRedFlag: true,
    },
    {
      id: "retching",
      prompt: "Está tentando vomitar sem conseguir?",
      type: "chips",
      options: ["Não", "Vômito com conteúdo", "Tentativa improdutiva"],
      redFlagValues: ["Tentativa improdutiva"],
      interruptOnRedFlag: true,
    },
    {
      id: "distendedAbdomen",
      prompt: "O abdômen de {petName} está muito aumentado?",
      type: "chips",
      options: ["Não", "Um pouco", "Muito aumentado"],
      redFlagValues: ["Muito aumentado"],
      interruptOnRedFlag: true,
    },
    {
      id: "extremePain",
      prompt: "Existe dor extrema (grito, não deixa tocar, inquietação intensa)?",
      type: "chips",
      options: ["Não", "Desconforto", "Dor extrema"],
      redFlagValues: ["Dor extrema"],
      interruptOnRedFlag: true,
    },
    {
      id: "chiefComplaint",
      prompt: "Em uma frase, o que motivou esta triagem de {petName}?",
      type: "textarea",
      when: (ctx) =>
        !["Não responde", "Quase não respira", "Está convulsionando", "Tenta e não produz"].some((flag) =>
          Object.values(ctx.answers).includes(flag)
        ),
    },
  ],
  analysisInstructions: `Este módulo NÃO é clínica geral. Responda apenas: QUÃO URGENTE É?
Classifique com equivalência:
VERMELHO — EMERGENCY
LARANJA — URGENT
AMARELO — SOON
VERDE — ROUTINE/MONITOR
O resultado DEVE dizer: CLASSIFICAÇÃO; POR QUE; QUAL SINAL GEROU A CLASSIFICAÇÃO; O QUE FAZER; EM QUANTO TEMPO; O QUE NÃO FAZER; O QUE OBSERVAR durante deslocamento/espera.
Se houver red flag crítica, não invente entrevista longa — justifique a classificação pelo sinal que a gerou.
nowDo, avoid e takeWithYou são obrigatórios e específicos ao pet.`,
  resultSections: [
    "Classificação",
    "Por que",
    "Sinal que gerou a classificação",
    "O que fazer",
    "Em quanto tempo",
    "O que não fazer",
    "O que observar",
  ],
  artifactConfig: {
    reportTitle: "RELATÓRIO DE TRIAGEM ECCOPET",
    hasWorkbook: false,
  },
  followUpPrompt: "Quer conversar comigo sobre a triagem de {petName}?",
  followUpSuggestions: [
    "Qual sinal tornou esta classificação necessária?",
    "O que NÃO devo fazer enquanto me desloco?",
    "O que observar no caminho?",
    "Se esse sinal melhorar, a urgência muda?",
  ],
};

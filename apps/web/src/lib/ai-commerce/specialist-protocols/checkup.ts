import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const checkupProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.CHECKUP,
  capabilityId: "eccocheckup.assessment",
  kind: "checkup",
  specialistTitle: "Dr. Ecco — Medicina Preventiva",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Vamos fazer o check-up de {petName} em blocos curtos — uma pergunta de cada vez.",
  commercialValue: "Faça uma revisão preventiva completa.",
  ctaLabel: "Fazer check-up",
  minimumData: ["energy", "appetite", "stool", "urine"],
  conditionalQuestions: ["cough", "mobility", "halitosis", "prevention"],
  redFlags: ["prostração", "não urina"],
  questionTree: [
    {
      id: "energy",
      prompt: "Como estão atividade e energia de {petName}?",
      type: "chips",
      options: ["Normal", "Um pouco baixa", "Muito apático", "Mais agitado"],
    },
    {
      id: "appetite",
      prompt: "Apetite e água de {petName} estão:",
      type: "chips",
      options: ["Normais", "Come menos", "Bebe mais", "Bebe menos", "Os dois alterados"],
    },
    {
      id: "weightChange",
      prompt: "O peso de {petName} mudou recentemente?",
      type: "chips",
      options: ["Estável", "Ganhou", "Perdeu", "Não peso em casa"],
      skipIfKnown: "weight",
      confirmIfKnown: true,
    },
    {
      id: "stool",
      prompt: "Vômito ou alteração de fezes nas últimas semanas?",
      type: "chips",
      options: ["Não", "Vômito ocasional", "Diarreia", "Os dois"],
    },
    {
      id: "urine",
      prompt: "A urina de {petName} parece normal?",
      type: "chips",
      options: ["Sim", "Mais frequente", "Faz força", "Sangue", "Não consegue urinar"],
      redFlagValues: ["Não consegue urinar"],
      interruptOnRedFlag: true,
    },
    {
      id: "skin",
      prompt: "Pele e pelo: coceira, lesões ou queda de pelo?",
      type: "chips",
      options: ["Normal", "Coceira", "Lesões", "Pelo opaco/queda"],
    },
    {
      id: "eyesEars",
      prompt: "Olhos ou ouvidos com alteração?",
      type: "chips",
      options: ["Normais", "Olho vermelho/secreção", "Ouvido/odor", "Os dois"],
    },
    {
      id: "halitosis",
      prompt: "Hálito e mastigação de {petName}?",
      type: "chips",
      options: ["Normais", "Mau hálito", "Dificuldade para mastigar", "Os dois"],
    },
    {
      id: "cough",
      prompt: "Tosse, cansaço ou respiração alterada?",
      type: "chips",
      options: ["Não", "Tosse", "Cansaço ao passear", "Respiração difícil"],
      redFlagValues: ["Respiração difícil"],
      interruptOnRedFlag: true,
    },
    {
      id: "mobility",
      prompt: "Mobilidade: dor, dificuldade para subir ou correr?",
      type: "chips",
      options: ["Normal", "Hesita em subir", "Manca", "Dor ao toque"],
    },
    {
      id: "behavior",
      prompt: "Alguma mudança de comportamento?",
      type: "chips",
      options: ["Não", "Mais retraído", "Mais irritadiço", "Outra mudança"],
    },
    {
      id: "prevention",
      prompt: "Prevenção: vacinas, parasitas e exames estão em dia?",
      type: "chips",
      options: ["Sim", "Vacinas em dúvida", "Parasitas em dúvida", "Exames atrasados", "Não sei"],
    },
  ],
  analysisInstructions: `Check-up é consulta preventiva guiada. NÃO produza lista genérica de 20 itens.
Crie CHECK-UP DE {pet} com SCORE/STATUS POR SISTEMA (Geral, Peso, Dental, Vacinas, Pele, Digestivo, Mobilidade, etc.) usando ✓, ! ou !!.
Para cada problema: ACHADO; POR QUE IMPORTA; AÇÃO RECOMENDADA; PRIORIDADE.
Ao final: TOP 3 PRIORIDADES DE {pet} — específicas deste animal, não um checklist universal.
Não peça de novo o que o contexto já contém.`,
  resultSections: [
    "Check-up do pet",
    "Status por sistema",
    "Achados",
    "Top 3 prioridades",
    "Ações recomendadas",
  ],
  artifactConfig: {
    reportTitle: "CHECK-UP PREVENTIVO — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Sistemas", "Prioridades"],
  },
  followUpPrompt: "Quer conversar comigo sobre o check-up de {petName}?",
  followUpSuggestions: [
    "Quais são as 3 prioridades deste pet?",
    "O que o status dental significa aqui?",
    "O que posso resolver em casa e o que precisa de consulta?",
    "Como reavaliar daqui a 30 dias?",
  ],
};

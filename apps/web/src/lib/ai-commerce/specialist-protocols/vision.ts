import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const visionProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.VISION,
  capabilityId: "eccovet.vision",
  kind: "vision",
  specialistTitle: "Dr. Ecco — Avaliação Visual",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Qual região de {petName} você quer que eu avalie na foto?",
  commercialValue: "Analise uma foto.",
  ctaLabel: "Analisar foto",
  minimumData: ["region", "visionUploaded"],
  conditionalQuestions: ["itches", "eyePain", "massGrowth"],
  redFlags: ["dor ocular intensa", "opacidade", "trauma ocular"],
  questionTree: [
    {
      id: "region",
      prompt: "Qual região a foto de {petName} mostra?",
      type: "chips",
      options: ["pele", "olho", "ouvido", "boca", "pata", "unha", "ferida", "massa/caroço", "fezes/vômito", "outro"],
    },
    {
      id: "visionUploaded",
      prompt: "Envie a foto com boa luz, sem filtro, o mais nítida possível.",
      type: "upload",
      uploadKind: "vision",
      accept: "image/jpeg,image/png,image/webp",
      multiple: true,
    },
    {
      id: "itches",
      prompt: "{petName} coça, lambe ou essa área dói?",
      type: "chips",
      options: ["Coça", "Lambe", "Dói", "Odor", "Cresceu", "Nada disso"],
      when: (ctx) => ctx.answers.region === "pele",
    },
    {
      id: "otherAnimals",
      prompt: "Outros animais da casa têm lesão parecida?",
      type: "chips",
      options: ["Não", "Sim", "Não sei"],
      when: (ctx) => ctx.answers.region === "pele",
    },
    {
      id: "eyePain",
      prompt: "{petName} fecha o olho, parece com dor ou houve trauma?",
      type: "chips",
      options: ["Não", "Fecha o olho", "Dor intensa", "Trauma", "Secreção", "Visão alterada"],
      redFlagValues: ["Dor intensa", "Trauma"],
      interruptOnRedFlag: true,
      when: (ctx) => ctx.answers.region === "olho",
    },
    {
      id: "massGrowth",
      prompt: "Há quanto tempo notou, qual o tamanho aproximado e cresceu?",
      type: "textarea",
      when: (ctx) => ctx.answers.region === "massa/caroço",
    },
    {
      id: "woundLook",
      prompt: "A ferida sangra, tem secreção ou parece contaminada?",
      type: "chips",
      options: ["Fechada/seca", "Aberta", "Sangra", "Secreção", "Muito suja"],
      when: (ctx) => ctx.answers.region === "ferida",
    },
  ],
  analysisInstructions: `Aja como analista visual. Primeiro avalie qualidade: foco, luz, distância, ângulo.
Se inadequada: imageQuality POOR/UNUSABLE, não desperdice análise, explique exatamente como tirar nova foto.
Descreva SOMENTE o visível.
Pele: localização, extensão, vermelhidão, alopecia, descamação, crosta, umidade, ulceração, secreção, pigmentação, simetria.
Olho: vermelhidão, secreção, opacidade, assimetria, edema, terceira pálpebra.
Ferida: local, abertura, sangramento, secreção, edema, tecido, contaminação visual.
Massa: NUNCA diga se é benigna ou maligna. Descreva superfície, cor, ulceração, localização.
Resultado: O QUE CONSIGO VER; O QUE NÃO É POSSÍVEL DETERMINAR POR FOTO; PRINCIPAIS POSSIBILIDADES; NÍVEL DE ATENÇÃO; COMO MONITORAR; QUANDO REAVALIAR; QUANDO PROCURAR ATENDIMENTO.`,
  resultSections: [
    "Qualidade da imagem",
    "O que consigo ver",
    "O que não é possível determinar por foto",
    "Principais possibilidades",
    "Nível de atenção",
    "Como monitorar",
    "Quando reavaliar",
  ],
  artifactConfig: {
    reportTitle: "RELATÓRIO DE AVALIAÇÃO VISUAL — ECCOPET AI",
    hasWorkbook: false,
  },
  followUpPrompt: "Quer conversar comigo sobre a foto de {petName}?",
  followUpSuggestions: [
    "O que exatamente você viu nesta foto?",
    "O que esta imagem NÃO permite afirmar?",
    "Como tiro uma foto melhor?",
    "Quando isso vira urgência?",
  ],
};

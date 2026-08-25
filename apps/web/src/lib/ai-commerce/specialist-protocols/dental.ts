import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const dentalProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.DENTAL,
  capabilityId: "eccodental.vision",
  kind: "dental",
  specialistTitle: "Dr. Ecco — Saúde Oral",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Vamos avaliar a boca de {petName} com o que você observa e, se for seguro, com fotos.",
  commercialValue: "Avalie a saúde oral.",
  ctaLabel: "Avaliar dentes",
  minimumData: ["halitosis"],
  conditionalQuestions: ["bleeding", "chewing", "dentalUploaded"],
  redFlags: ["sangramento intenso", "não consegue comer"],
  questionTree: [
    {
      id: "halitosis",
      prompt: "{petName} está com mau hálito?",
      type: "chips",
      options: ["Não", "Leve", "Moderado", "Forte"],
    },
    {
      id: "bleeding",
      prompt: "Há sangramento na gengiva ou ao mastigar?",
      type: "chips",
      options: ["Não", "Às vezes", "Frequente"],
    },
    {
      id: "chewing",
      prompt: "{petName} mastiga de um lado só, deixa cair alimento ou salivando mais?",
      type: "chips",
      options: ["Não", "Mastigação unilateral", "Deixa cair alimento", "Sialorreia", "Pata na boca"],
    },
    {
      id: "lastCleaning",
      prompt: "Quando foi a última limpeza odontológica profissional?",
      type: "chips",
      options: ["Nunca", "Há menos de 1 ano", "Há 1–3 anos", "Não sei"],
    },
    {
      id: "dentalUploaded",
      prompt: "Se for seguro, envie 3 fotos: frontal, lado direito e lado esquerdo. Não force a boca.",
      type: "upload",
      uploadKind: "vision",
      accept: "image/jpeg,image/png,image/webp",
      multiple: true,
      slots: ["Frontal", "Lateral direita", "Lateral esquerda"],
    },
  ],
  analysisInstructions: `Aja como avaliador de saúde oral.
Produza MAPA ORAL VISUAL: incisivos; caninos; pré-molares/molares visíveis; gengiva; tártaro (baixo/moderado/importante VISUALMENTE).
Avalie: placa/tártaro visível, linha gengival, vermelhidão, retração aparente, sangramento visível, fraturas, dentes ausentes visíveis, massas/lesões, assimetria.
NUNCA declare estágio periodontal definitivo sem exame presencial e radiografias.
Depois: PRIORIDADE ODONTOLÓGICA; CUIDADOS DOMICILIARES SEGUROS; O QUE EVITAR; QUANDO AVALIAÇÃO ODONTOLÓGICA É INDICADA.
Não incentive manipulação perigosa da boca.`,
  resultSections: [
    "Mapa oral visual",
    "Incisivos",
    "Caninos",
    "Pré-molares/molares",
    "Gengiva",
    "Tártaro visual",
    "Prioridade odontológica",
    "Cuidados domiciliares seguros",
    "O que evitar",
    "Quando avaliar presencialmente",
  ],
  artifactConfig: {
    reportTitle: "AVALIAÇÃO VISUAL DE SAÚDE ORAL — ECCOPET AI",
    hasWorkbook: false,
  },
  followUpPrompt: "Quer conversar comigo sobre a boca de {petName}?",
  followUpSuggestions: [
    "O tártaro que você viu é discreto ou importante?",
    "Quais cuidados caseiros são seguros neste caso?",
    "O que eu não devo fazer em casa?",
    "Quando uma avaliação odontológica presencial é indicada?",
  ],
};

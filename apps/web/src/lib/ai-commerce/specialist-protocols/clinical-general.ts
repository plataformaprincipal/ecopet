import { AI_COMMERCE_SKUS } from "../flags";
import { hasEmergencySignals, systemIs } from "./engine";
import type { InterviewContext, SpecialistProtocol } from "./types";

const gi = (kind?: "vomito" | "diarreia" | "ambos") => (ctx: InterviewContext) => {
  if (!systemIs(ctx, "gastrointestinal")) return false;
  if (hasEmergencySignals(ctx)) return false;
  if (!kind) return true;
  const current = String(ctx.answers.giKind ?? "");
  return current === kind || current === "Ambos";
};

export const clinicalGeneralProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.ECCOVET,
  capabilityId: "eccovet.assessment",
  kind: "assessment",
  specialistTitle: "Dr. Ecco — Clínica Geral",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "O que está acontecendo com {petName} hoje?",
  commercialValue: "Conte os sintomas e faça uma avaliação guiada.",
  ctaLabel: "Conversar com Dr. Ecco",
  minimumData: ["chiefComplaint", "onset", "severity"],
  conditionalQuestions: ["giKind", "vomitCount", "waterKept", "urineProduced", "openMouthBreathing", "seizureDuration"],
  redFlags: [
    "tentativa improdutiva de vômito",
    "incapacidade de urinar",
    "respiração de boca aberta",
    "convulsão repetida",
    "prostração",
    "sangue",
  ],
  questionTree: [
    {
      id: "chiefComplaint",
      prompt: "O que está acontecendo com {petName} hoje?",
      type: "textarea",
      required: true,
    },
    {
      id: "affectedSystem",
      prompt: "Para orientar a anamnese de {petName}, qual sistema parece mais afetado?",
      type: "chips",
      options: [
        "gastrointestinal",
        "respiratório",
        "urinário",
        "neurológico",
        "dermatológico",
        "ocular",
        "otológico",
        "locomotor",
        "dor",
        "febre",
        "apatia",
        "apetite",
        "intoxicação",
        "trauma",
        "outro",
      ],
      when: (ctx) => !systemIs(ctx, "gastrointestinal", "respiratório", "urinário", "neurológico", "dermatológico", "ocular", "otológico", "locomotor", "dor", "febre", "apatia", "apetite", "intoxicação", "trauma"),
    },
    {
      id: "onset",
      prompt: "Quando isso começou com {petName}?",
      type: "chips",
      options: ["Hoje", "Ontem", "2–3 dias", "4–7 dias", "Mais de uma semana", "Não sei"],
    },
    {
      id: "severity",
      prompt: "Como você classifica a intensidade agora?",
      type: "chips",
      options: ["Leve", "Moderada", "Intensa", "Piorando rápido"],
    },
    {
      id: "progression",
      prompt: "Desde o início, o quadro de {petName} está:",
      type: "chips",
      options: ["Melhorando", "Estável", "Piorando", "Vai e volta"],
    },
    {
      id: "giKind",
      prompt: "No trato digestivo de {petName}, o que predomina?",
      type: "chips",
      options: ["Vômito", "Diarreia", "Ambos", "Náusea sem vômito"],
      when: (ctx) => systemIs(ctx, "gastrointestinal") && !hasEmergencySignals(ctx),
    },
    {
      id: "vomitCount",
      prompt: "Quantas vezes {petName} vomitou nas últimas 12 horas?",
      type: "chips",
      options: ["1", "2–3", "4–6", "Mais de 6", "Não sei"],
      when: gi("vomito"),
    },
    {
      id: "vomitContent",
      prompt: "O que veio no vômito?",
      type: "chips",
      options: ["Alimento", "Espuma", "Bile", "Sangue", "Objeto", "Desconhecido"],
      when: gi("vomito"),
    },
    {
      id: "waterKept",
      prompt: "{petName} consegue manter água?",
      type: "chips",
      options: ["Sim", "Vômitos a água", "Não está bebendo", "Não sei"],
      when: gi(),
    },
    {
      id: "unproductiveRetching",
      prompt: "Há tentativas de vomitar sem produzir conteúdo?",
      type: "chips",
      options: ["Não", "Sim"],
      redFlagValues: ["Sim"],
      interruptOnRedFlag: true,
      when: gi("vomito"),
    },
    {
      id: "stoolConsistency",
      prompt: "Como estão as fezes de {petName}?",
      type: "chips",
      options: ["Formadas", "Pastosa", "Líquida", "Muco", "Sangue vivo", "Muito escuras", "Não vi"],
      when: gi("diarreia"),
    },
    {
      id: "stoolFrequency",
      prompt: "Com que frequência {petName} está evacúando?",
      type: "chips",
      options: ["1–2x", "3–5x", "Mais de 5x", "Não sei"],
      when: gi("diarreia"),
    },
    {
      id: "possibleIngestion",
      prompt: "{petName} pode ter ingerido lixo, planta, objeto, medicamento ou produto químico?",
      type: "chips",
      options: ["Não", "Possível", "Sim, vi acontecer", "Não sei"],
      when: gi(),
    },
    {
      id: "dietChange",
      prompt: "Houve mudança alimentar recente?",
      type: "chips",
      options: ["Não", "Comida diferente", "Petisco novo", "Lixo / mesa", "Não sei"],
      when: gi(),
    },
    {
      id: "coughOrDyspnea",
      prompt: "{petName} está com tosse ou dificuldade para respirar?",
      type: "chips",
      options: ["Tosse", "Dificuldade para respirar", "Os dois", "Nenhum"],
      when: (ctx) => systemIs(ctx, "respiratório"),
    },
    {
      id: "openMouthBreathing",
      prompt: "{petName} está respirando de boca aberta ou com esforço abdominal?",
      type: "chips",
      options: ["Não", "Boca aberta", "Esforço abdominal", "Os dois"],
      redFlagValues: ["Boca aberta", "Esforço abdominal", "Os dois"],
      interruptOnRedFlag: true,
      when: (ctx) => systemIs(ctx, "respiratório"),
    },
    {
      id: "urinePattern",
      prompt: "{petName} está urinando normalmente?",
      type: "chips",
      options: ["Sim", "Pequenas quantidades", "Faz força", "Não consegue eliminar", "Fora do lugar", "Não sei"],
      redFlagValues: ["Não consegue eliminar"],
      interruptOnRedFlag: true,
      when: (ctx) => systemIs(ctx, "urinário"),
    },
    {
      id: "urineBlood",
      prompt: "Há sangue na urina ou lambedura intensa da região?",
      type: "chips",
      options: ["Não", "Sangue", "Lambe muito", "Os dois", "Não sei"],
      when: (ctx) => systemIs(ctx, "urinário") && !hasEmergencySignals(ctx),
    },
    {
      id: "seizure",
      prompt: "{petName} teve convulsão ou perda de consciência?",
      type: "chips",
      options: ["Não", "Convulsão", "Desmaio", "Não recuperou consciência"],
      redFlagValues: ["Não recuperou consciência"],
      interruptOnRedFlag: true,
      when: (ctx) => systemIs(ctx, "neurológico"),
    },
    {
      id: "seizureDuration",
      prompt: "Quanto durou o episódio e foi o primeiro?",
      type: "chips",
      options: ["< 1 min, primeiro", "< 1 min, já ocorreu", "1–3 min", "Prolongado ou repetido", "Não sei"],
      redFlagValues: ["Prolongado ou repetido"],
      interruptOnRedFlag: true,
      when: (ctx) => systemIs(ctx, "neurológico") && String(ctx.answers.seizure ?? "") !== "Não",
    },
    {
      id: "lameLimb",
      prompt: "Qual membro {petName} está poupando?",
      type: "chips",
      options: ["Dianteiro direito", "Dianteiro esquerdo", "Traseiro direito", "Traseiro esquerdo", "Mais de um", "Não sei"],
      when: (ctx) => systemIs(ctx, "locomotor", "dor") && !hasEmergencySignals(ctx),
    },
    {
      id: "bearsWeight",
      prompt: "{petName} apoia o membro?",
      type: "chips",
      options: ["Sim", "Parcialmente", "Não apoia", "Não sei"],
      when: (ctx) => systemIs(ctx, "locomotor", "dor") && !hasEmergencySignals(ctx),
    },
    {
      id: "appetiteEnergy",
      prompt: "Como estão apetite e energia de {petName}?",
      type: "chips",
      options: ["Normais", "Apetite baixo", "Muito apático", "Os dois alterados"],
    },
  ],
  analysisInstructions: `Módulo: Clínica Geral. Produza anamnese digital e impressão clínica assistida PERSONALIZADA.
Obrigatório no texto (não genérico):
1. RESUMO DO CASO no formato "{nome}, {raça/espécie}, {idade}, apresenta … iniciado há …".
2. ACHADOS IMPORTANTES: positivos e negativos relevantes separados.
3. IMPRESSÃO CLÍNICA ASSISTIDA específica ao caso, com o que é mais compatível e o que é menos provável e por quê.
4. DIFERENCIAIS priorizados (3–5). Para cada: por que é compatível; dados contra; o que mudaria a probabilidade.
5. NÍVEL DE ATENÇÃO.
6. O QUE FAZER AGORA — ações concretas e seguras (não "procure um veterinário" isolado).
7. O QUE MONITORAR — frequência, tempo, mudanças.
8. SINAIS QUE MUDAM A URGÊNCIA.
9. PRÓXIMO PASSO.
Não execute análise vaga. Se faltar um dado crítico, declare exatamente o que falta em missingInformation e ainda assim interprete o que já existe.
Nunca invente achado não relatado.`,
  resultSections: [
    "Resumo do caso",
    "Achados importantes",
    "Impressão clínica assistida",
    "Diferenciais priorizados",
    "Nível de atenção",
    "O que fazer agora",
    "O que monitorar",
    "Sinais que mudam a urgência",
    "Próximo passo",
  ],
  artifactConfig: {
    reportTitle: "RELATÓRIO DE AVALIAÇÃO CLÍNICA — ECCOPET AI",
    hasWorkbook: true,
    workbookSheets: ["Resumo", "Achados", "Diferenciais"],
  },
  followUpPrompt: "Quer conversar comigo sobre a análise de {petName}?",
  followUpSuggestions: [
    "Explique a hipótese principal com os dados deste caso.",
    "O que tornaria obstrução mais ou menos provável?",
    "O que devo registrar nas próximas 12 horas?",
    "Quais perguntas levar para a consulta?",
  ],
};

import { AI_COMMERCE_SKUS } from "../flags";
import type { SpecialistProtocol } from "./types";

export const medicationProtocol: SpecialistProtocol = {
  sku: AI_COMMERCE_SKUS.MED,
  capabilityId: "eccomed.review",
  kind: "med",
  specialistTitle: "Dr. Ecco — Segurança Medicamentosa",
  specialistRole: "Veterinário Virtual EccoPet · Análise assistida por inteligência artificial",
  intro: "Vamos revisar com segurança o que já foi orientado para {petName} — sem inventar dose.",
  commercialValue: "Revise medicamentos com segurança.",
  ctaLabel: "Revisar medicamentos",
  minimumData: ["medContext"],
  conditionalQuestions: ["name", "doseWritten", "frequency", "otherMeds"],
  redFlags: ["ingestão acidental de medicamento humano"],
  questionTree: [
    {
      id: "medContext",
      prompt: "O que você quer revisar sobre medicação de {petName}?",
      type: "chips",
      options: [
        "Receita / medicamento prescrito",
        "Foto da caixa ou frasco",
        "Organizar horários do que já toma",
        "Ingestão acidental de medicamento humano",
      ],
      redFlagValues: ["Ingestão acidental de medicamento humano"],
      interruptOnRedFlag: true,
    },
    {
      id: "rxUpload",
      prompt: "Envie foto da caixa, frasco ou receita.",
      type: "upload",
      uploadKind: "lab",
      accept: "application/pdf,image/jpeg,image/png,image/webp",
      multiple: true,
      when: (ctx) =>
        ctx.answers.medContext === "Receita / medicamento prescrito" || ctx.answers.medContext === "Foto da caixa ou frasco",
    },
    {
      id: "name",
      prompt: "Qual o medicamento e, se souber, o princípio ativo?",
      type: "text",
      when: (ctx) => ctx.answers.medContext !== "Ingestão acidental de medicamento humano",
    },
    {
      id: "presentation",
      prompt: "Qual a concentração e a forma (comprimido, xarope, pipeta)?",
      type: "text",
    },
    {
      id: "doseWritten",
      prompt: "Qual a dose QUE FOI ORIENTADA (como está escrita)?",
      helper: "Eu organizo o que está documentado. Não invento e não altero a prescrição.",
      type: "text",
    },
    {
      id: "frequency",
      prompt: "Qual a frequência e a via?",
      type: "text",
    },
    {
      id: "reason",
      prompt: "Por que {petName} está usando este medicamento?",
      type: "text",
    },
    {
      id: "prescriber",
      prompt: "Quem prescreveu?",
      type: "text",
    },
    {
      id: "otherMeds",
      prompt: "Quais outras medicações {petName} usa?",
      type: "textarea",
      skipIfKnown: "medications",
      confirmIfKnown: true,
    },
    {
      id: "kidneyLiver",
      prompt: "Há doença renal, hepática ou gestação conhecida?",
      type: "chips",
      options: ["Não", "Renal", "Hepática", "Gestação", "Não sei"],
    },
  ],
  analysisInstructions: `Aja como REVISOR FARMACOLÓGICO.
NUNCA invente dose. NUNCA responda "Dê X mg" sem base documental/prescrição.
Se a dose prescrita estiver documentada, pode calcular: mg por dose e mg/kg por dose. Isso é cálculo, não prescrição.
Se o usuário informou ingestão acidental de medicamento humano: trate como toxicidade/triagem. Classifique urgência. Não continue como organizador de receita.
Resultado: IDENTIFICAÇÃO; CLASSE; FINALIDADE USUAL; USO INFORMADO PARA ESTE PET; PONTOS DE SEGURANÇA; HORÁRIOS; INTERAÇÕES RELEVANTES; REAÇÕES ADVERSAS IMPORTANTES; SINAIS PARA MONITORAR; PONTOS QUE PRECISAM SER CONFIRMADOS.
needsConfirmation=true.`,
  resultSections: [
    "Identificação do medicamento",
    "Classe",
    "Finalidade usual",
    "Uso informado para este pet",
    "Pontos de segurança",
    "Horários/administração",
    "Interações relevantes",
    "Reações adversas importantes",
    "Sinais para monitorar",
    "Pontos a confirmar",
  ],
  artifactConfig: {
    reportTitle: "RESUMO FARMACOLÓGICO ECCOPET",
    hasWorkbook: true,
    workbookSheets: ["Administração"],
  },
  followUpPrompt: "Quer conversar comigo sobre o medicamento de {petName}?",
  followUpSuggestions: [
    "Isso corresponde a quantos mg/kg com o peso registrado?",
    "Quais pontos precisam ser confirmados com o prescritor?",
    "A IA pode mudar a dose?",
    "O que monitorar nas próximas 24 horas?",
  ],
};

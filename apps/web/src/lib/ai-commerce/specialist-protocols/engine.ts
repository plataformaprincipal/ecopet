import type { InterviewContext, InterviewQuestion, SpecialistProtocol } from "./types";

function asRec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function petNameFromContext(petContext: Record<string, unknown> | null, fallback = "seu pet"): string {
  const identity = asRec(petContext?.identity);
  if (typeof identity.name === "string" && identity.name.trim()) return identity.name.trim();
  if (typeof petContext?.name === "string" && petContext.name.trim()) return petContext.name.trim();
  return fallback;
}

export function knownValue(petContext: Record<string, unknown> | null, key: string): unknown {
  if (!petContext) return undefined;
  const identity = asRec(petContext.identity);
  const anthro = asRec(petContext.anthropometrics);
  const health = asRec(petContext.health);
  const nutrition = asRec(petContext.nutrition);
  const map: Record<string, unknown> = {
    name: identity.name ?? petContext.name,
    species: identity.species ?? petContext.species,
    breed: identity.breed ?? petContext.breed,
    sex: identity.sex ?? petContext.sex,
    age: identity.age ?? petContext.age,
    weight: anthro.weight ?? petContext.weight,
    weightHistory: anthro.weightHistory,
    neutered: identity.neutered ?? petContext.neutered,
    allergies: health.allergies,
    conditions: health.conditions,
    medications: petContext.medications,
    vaccines: petContext.vaccines,
    exams: petContext.exams,
    nutrition: nutrition.diet,
    diet: nutrition.diet,
  };
  return map[key];
}

export function hasReliableKnown(value: unknown): boolean {
  if (value == null || value === "" || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function interpolate(text: string, ctx: InterviewContext): string {
  return text.replaceAll("{petName}", ctx.petName);
}

export function isAnswered(answers: Record<string, unknown>, id: string): boolean {
  const value = answers[id];
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) => item != null && item !== "");
  }
  return true;
}

function valueIncludes(value: unknown, needle: string): boolean {
  const n = needle.toLowerCase();
  if (Array.isArray(value)) return value.some((item) => String(item).toLowerCase().includes(n));
  return String(value ?? "")
    .toLowerCase()
    .includes(n);
}

export function inferAffectedSystem(complaint: string): string | null {
  const t = complaint
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (/vomit|enjo|nausea|diarreia|fezes|gastro|bile/.test(t)) return "gastrointestinal";
  if (/tosse|respir|espirro|nariz|falta de ar|ofeg/.test(t)) return "respiratório";
  if (/urina|xixi|bexiga|renal|mic[c]?/.test(t)) return "urinário";
  if (/convuls|desmaio|equilibrio|neurol|paralis|cabe[c]a inclin/.test(t)) return "neurológico";
  if (/coceira|pele|pelo|dermat|ferida|alopec|crosta/.test(t)) return "dermatológico";
  if (/olho|ocular|conjuntiv/.test(t)) return "ocular";
  if (/ouvido|otit|orelha/.test(t)) return "otológico";
  if (/manca|pata|coxea|articul|claudic|loco/.test(t)) return "locomotor";
  if (/dor|geme|grunh/.test(t)) return "dor";
  if (/febre/.test(t)) return "febre";
  if (/apat|prostr|letarg|sem energia/.test(t)) return "apatia";
  if (/apetite|nao come|parou de comer/.test(t)) return "apetite";
  if (/toxi|veneno|ingeriu|chocolate|ibuprofeno|paracetamol/.test(t)) return "intoxicação";
  if (/atropel|queda|trauma|mordid|acidente/.test(t)) return "trauma";
  return null;
}

export function currentSystem(ctx: InterviewContext): string {
  const explicit = String(ctx.answers.affectedSystem ?? "");
  if (explicit) return explicit;
  return inferAffectedSystem(String(ctx.answers.chiefComplaint ?? "")) ?? "";
}

export function systemIs(ctx: InterviewContext, ...systems: string[]): boolean {
  const current = currentSystem(ctx).toLowerCase();
  return systems.some((item) => current.includes(item.toLowerCase()));
}

export function hasEmergencySignals(ctx: InterviewContext): boolean {
  const blob = Object.values(ctx.answers).join(" ").toLowerCase();
  return /sangue|prostra|inconsciente|convuls|nao consegue urinar|boca aberta|tentativa improdutiva|abdomen aumentado|dor extrema/.test(
    blob
  );
}

export function questionApplies(question: InterviewQuestion, ctx: InterviewContext): boolean {
  if (question.when && !question.when(ctx)) return false;
  if (
    question.skipIfKnown &&
    !question.confirmIfKnown &&
    hasReliableKnown(knownValue(ctx.petContext, question.skipIfKnown))
  ) {
    return false;
  }
  return true;
}

function confirmPrompt(question: InterviewQuestion, ctx: InterviewContext): string {
  const raw = knownValue(ctx.petContext, question.skipIfKnown ?? "");
  const pretty = Array.isArray(raw) ? raw.map(String).slice(0, 3).join(", ") : String(raw);
  if (question.skipIfKnown === "weight") {
    return `Tenho registrado que ${ctx.petName} pesa ${pretty} kg. Esse peso continua correto?`;
  }
  return `Tenho registrado sobre ${ctx.petName}: ${pretty}. Isso continua correto?`;
}

export function resolveQuestion(question: InterviewQuestion, ctx: InterviewContext): InterviewQuestion {
  return { ...question, prompt: interpolate(question.prompt, ctx) };
}

export function nextInterviewQuestion(
  protocol: SpecialistProtocol,
  answers: Record<string, unknown>,
  petContext: Record<string, unknown> | null
): InterviewQuestion | null {
  const ctx: InterviewContext = { answers, petContext, petName: petNameFromContext(petContext) };
  for (const question of protocol.questionTree) {
    if (!questionApplies(question, ctx)) continue;
    if (question.confirmIfKnown && question.skipIfKnown && hasReliableKnown(knownValue(petContext, question.skipIfKnown))) {
      const confirmId = `${question.id}__confirm`;
      if (!isAnswered(answers, confirmId)) {
        return {
          ...question,
          id: confirmId,
          type: "confirm",
          options: ["Sim", "Atualizar"],
          prompt: confirmPrompt(question, ctx),
        };
      }
      if (answers[confirmId] === "Atualizar" && !isAnswered(answers, question.id)) {
        return resolveQuestion(question, ctx);
      }
      continue;
    }
    if (!isAnswered(answers, question.id)) return resolveQuestion(question, ctx);
  }
  return null;
}

export function answeredRedFlag(
  protocol: SpecialistProtocol,
  answers: Record<string, unknown>
): { questionId: string; value: string } | null {
  for (const question of protocol.questionTree) {
    if (!question.interruptOnRedFlag || !question.redFlagValues?.length) continue;
    const value = answers[question.id];
    const hit = question.redFlagValues.find((flag) => valueIncludes(value, flag));
    if (hit) return { questionId: question.id, value: hit };
  }
  return null;
}

export function shouldInterruptInterview(protocol: SpecialistProtocol, answers: Record<string, unknown>): boolean {
  return Boolean(answeredRedFlag(protocol, answers));
}

export function missingMinimumData(
  protocol: SpecialistProtocol,
  answers: Record<string, unknown>,
  petContext: Record<string, unknown> | null
): string[] {
  const ctx: InterviewContext = { answers, petContext, petName: petNameFromContext(petContext) };
  return protocol.minimumData.filter((id) => {
    if (isAnswered(answers, id)) return false;
    const question = protocol.questionTree.find((item) => item.id === id);
    if (
      question?.skipIfKnown &&
      hasReliableKnown(knownValue(petContext, question.skipIfKnown)) &&
      answers[`${id}__confirm`] !== "Atualizar"
    ) {
      return false;
    }
    if (question && !questionApplies(question, ctx)) return false;
    return true;
  });
}

export function isInterviewReady(
  protocol: SpecialistProtocol,
  answers: Record<string, unknown>,
  petContext: Record<string, unknown> | null
): boolean {
  if (shouldInterruptInterview(protocol, answers)) return true;
  return missingMinimumData(protocol, answers, petContext).length === 0;
}

export function interviewTranscript(
  protocol: SpecialistProtocol,
  answers: Record<string, unknown>,
  petContext: Record<string, unknown> | null
): Array<{ id: string; prompt: string; answer: string }> {
  const ctx: InterviewContext = { answers, petContext, petName: petNameFromContext(petContext) };
  const rows: Array<{ id: string; prompt: string; answer: string }> = [];
  for (const question of protocol.questionTree) {
    const confirmId = `${question.id}__confirm`;
    if (isAnswered(answers, confirmId)) {
      rows.push({
        id: confirmId,
        prompt: confirmPrompt(question, ctx),
        answer: String(answers[confirmId]),
      });
    }
    if (!isAnswered(answers, question.id)) continue;
    const value = answers[question.id];
    rows.push({
      id: question.id,
      prompt: interpolate(question.prompt, ctx),
      answer: Array.isArray(value) ? value.map(String).join(", ") : String(value),
    });
  }
  return rows;
}

import { AI_COMMERCE_SKUS, type AiCommerceSku } from "../flags";
import { behaviorProtocol } from "./behavior";
import { checkupProtocol } from "./checkup";
import { clinicalGeneralProtocol } from "./clinical-general";
import { dentalProtocol } from "./dental";
import { healthProfileProtocol } from "./health-profile";
import { labsProtocol } from "./labs";
import { medicationProtocol } from "./medication";
import { nutritionProtocol } from "./nutrition";
import { reportProtocol } from "./report";
import { triageProtocol } from "./triage";
import { vaccinationProtocol } from "./vaccination";
import { visionProtocol } from "./vision";
import { weightProtocol } from "./weight";
import type { SpecialistProtocol } from "./types";

export type { InterviewAnswerType, InterviewContext, InterviewQuestion, SpecialistProtocol } from "./types";
export {
  answeredRedFlag,
  currentSystem,
  hasEmergencySignals,
  inferAffectedSystem,
  interviewTranscript,
  isAnswered,
  isInterviewReady,
  knownValue,
  missingMinimumData,
  nextInterviewQuestion,
  petNameFromContext,
  shouldInterruptInterview,
  systemIs,
} from "./engine";

const PROTOCOLS: SpecialistProtocol[] = [
  clinicalGeneralProtocol,
  triageProtocol,
  reportProtocol,
  labsProtocol,
  visionProtocol,
  nutritionProtocol,
  weightProtocol,
  dentalProtocol,
  behaviorProtocol,
  vaccinationProtocol,
  medicationProtocol,
  checkupProtocol,
  healthProfileProtocol,
];

const BY_SKU = new Map(PROTOCOLS.map((p) => [p.sku, p]));

export function listSpecialistProtocols(): SpecialistProtocol[] {
  return PROTOCOLS;
}

export function getSpecialistProtocol(sku: string): SpecialistProtocol | undefined {
  return BY_SKU.get(sku as AiCommerceSku);
}

/** First user message/chip becomes structured interview input without inventing answers. */
export function initialInterviewInput(sku: string, message?: string): Record<string, unknown> {
  const text = message?.trim();
  if (!text) return {};
  const protocol = getSpecialistProtocol(sku);
  const first = protocol?.questionTree[0];
  if (first?.options?.length) {
    const matched = first.options.find((opt) => opt.toLowerCase() === text.toLowerCase());
    if (matched) return { [first.id]: matched };
  }
  if (first && (first.type === "textarea" || first.type === "text")) {
    return { [first.id]: text };
  }
  return { chiefComplaint: text };
}

export function getSpecialistProtocolByCapability(capabilityId: string): SpecialistProtocol | undefined {
  const exact = PROTOCOLS.find((p) => p.capabilityId === capabilityId);
  if (exact) return exact;
  const id = capabilityId.toLowerCase();
  if (id.includes("triage")) return triageProtocol;
  if (id.includes("dental")) return dentalProtocol;
  if (id.includes("vision")) return visionProtocol;
  if (id.includes("exams") || id === "eccolab") return labsProtocol;
  if (id.includes("checkup")) return checkupProtocol;
  if (id.includes("nutri")) return nutritionProtocol;
  if (id.includes("peso")) return weightProtocol;
  if (id.includes("behavior")) return behaviorProtocol;
  if (id.includes("vacina")) return vaccinationProtocol;
  if (id.includes("eccomed") || id.endsWith(".review") || id.includes("med")) return medicationProtocol;
  if (id.includes("pethealth") || id.includes("profile")) return healthProfileProtocol;
  if (id.includes("report")) return reportProtocol;
  if (id.includes("eccovet")) return clinicalGeneralProtocol;
  return undefined;
}

export const SPECIALIST_PROTOCOL_SKUS: AiCommerceSku[] = [
  AI_COMMERCE_SKUS.ECCOVET,
  AI_COMMERCE_SKUS.TRIAGE,
  AI_COMMERCE_SKUS.REPORT,
  AI_COMMERCE_SKUS.EXAMS,
  AI_COMMERCE_SKUS.VISION,
  AI_COMMERCE_SKUS.NUTRI,
  AI_COMMERCE_SKUS.PESO,
  AI_COMMERCE_SKUS.DENTAL,
  AI_COMMERCE_SKUS.BEHAVIOR,
  AI_COMMERCE_SKUS.VACCINE,
  AI_COMMERCE_SKUS.MED,
  AI_COMMERCE_SKUS.CHECKUP,
  AI_COMMERCE_SKUS.HEALTH_PROFILE,
];

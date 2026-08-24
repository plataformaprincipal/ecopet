import { z } from "zod";
import { specialistJsonByCapability, specialistSchemaFor } from "./specialist-output";

export const urgencyEnum = z.enum(["ROUTINE", "MONITOR", "SOON", "URGENT", "EMERGENCY"]);

export const eccovetOutputSchema = z.object({
  summary: z.string().min(1),
  complaint: z.string().min(1),
  relevantHistory: z.string(),
  observations: z.array(z.string()),
  attentionSigns: z.array(z.string()),
  urgencyLevel: urgencyEnum,
  possibleConsiderations: z.array(z.string()),
  recommendedNextSteps: z.array(z.string()),
  watchFor: z.array(z.string()).default([]),
  vetQuestions: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const visionOutputSchema = z.object({
  imageQuality: z.string(),
  visibleRegion: z.string(),
  visibleObservations: z.array(z.string()),
  apparentChanges: z.array(z.string()),
  attentionSigns: z.array(z.string()),
  urgencyLevel: urgencyEnum,
  recommendedNextSteps: z.array(z.string()),
  comparisonNotes: z.string().nullable().optional(),
  limitations: z.array(z.string()),
});

export const labMarkerSchema = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string().nullable(),
  reference: z.string().nullable(),
  status: z.enum(["WITHIN", "ABOVE", "BELOW", "UNAVAILABLE"]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  sourcePage: z.number().int().nullable().optional(),
});

export const labOutputSchema = z.object({
  examName: z.string(),
  laboratory: z.string().nullable(),
  examDate: z.string().nullable(),
  speciesMentioned: z.string().nullable(),
  markers: z.array(labMarkerSchema),
  summary: z.string(),
  mainChanges: z.array(z.string()),
  historicalNotes: z.string().nullable().optional(),
  vetTalkingPoints: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const checkupOutputSchema = z.object({
  overview: z.string(),
  routine: z.string(),
  feeding: z.string(),
  activity: z.string(),
  prevention: z.string(),
  followUpPoints: z.array(z.string()),
  priorities: z.array(z.string()),
  nextSteps: z.array(z.string()),
  vetQuestions: z.array(z.string()),
  accompanimentIndex: z.number().min(0).max(100).nullable().optional(),
  accompanimentMethod: z.string().optional(),
  compatibleProductQueries: z.array(z.string()).optional(),
  urgencyLevel: urgencyEnum,
  limitations: z.array(z.string()),
});

export type EccovetOutput = z.infer<typeof eccovetOutputSchema>;
export type VisionOutput = z.infer<typeof visionOutputSchema>;
export type LabOutput = z.infer<typeof labOutputSchema>;
export type CheckupOutput = z.infer<typeof checkupOutputSchema>;

export function schemaForCapability(capabilityId: string) {
  return specialistSchemaFor(capabilityId);
}

export function normalizeCapability(capabilityId: string): string {
  if (capabilityId === "eccovet" || capabilityId === "eccovet.assessment") return "eccovet.assessment";
  if (capabilityId === "eccovet_vision" || capabilityId === "eccovet.vision") return "eccovet.vision";
  if (capabilityId === "eccolab" || capabilityId === "eccovet.exams") return "eccovet.exams";
  if (capabilityId === "eccocheckup" || capabilityId === "eccocheckup.assessment") return "eccocheckup.assessment";
  return capabilityId;
}

export const jsonSchemaByCapability: Record<string, Record<string, unknown>> = {
  ...specialistJsonByCapability,
  eccovet: specialistJsonByCapability["eccovet.assessment"]!,
  eccovet_vision: specialistJsonByCapability["eccovet.vision"]!,
  eccolab: specialistJsonByCapability["eccovet.exams"]!,
  eccocheckup: specialistJsonByCapability["eccocheckup.assessment"]!,
};

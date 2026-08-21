import { z } from "zod";

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
  const id = normalizeCapability(capabilityId);
  if (id === "eccovet.vision" || id === "eccodental.vision") return visionOutputSchema;
  if (id === "eccovet.exams") return labOutputSchema;
  if (id === "eccocheckup.assessment") return checkupOutputSchema;
  if (id === "eccovet.triage") return eccovetOutputSchema;
  return eccovetOutputSchema;
}

export function normalizeCapability(capabilityId: string): string {
  if (capabilityId === "eccovet" || capabilityId === "eccovet.assessment") return "eccovet.assessment";
  if (capabilityId === "eccovet_vision" || capabilityId === "eccovet.vision") return "eccovet.vision";
  if (capabilityId === "eccolab" || capabilityId === "eccovet.exams") return "eccovet.exams";
  if (capabilityId === "eccocheckup" || capabilityId === "eccocheckup.assessment") return "eccocheckup.assessment";
  return capabilityId;
}

export const jsonSchemaByCapability: Record<string, Record<string, unknown>> = {
  "eccovet.assessment": {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "complaint",
      "relevantHistory",
      "observations",
      "attentionSigns",
      "urgencyLevel",
      "possibleConsiderations",
      "recommendedNextSteps",
      "watchFor",
      "vetQuestions",
      "limitations",
    ],
    properties: {
      summary: { type: "string" },
      complaint: { type: "string" },
      relevantHistory: { type: "string" },
      observations: { type: "array", items: { type: "string" } },
      attentionSigns: { type: "array", items: { type: "string" } },
      urgencyLevel: { type: "string", enum: ["ROUTINE", "MONITOR", "SOON", "URGENT", "EMERGENCY"] },
      possibleConsiderations: { type: "array", items: { type: "string" } },
      recommendedNextSteps: { type: "array", items: { type: "string" } },
      watchFor: { type: "array", items: { type: "string" } },
      vetQuestions: { type: "array", items: { type: "string" } },
      limitations: { type: "array", items: { type: "string" } },
    },
  },
  "eccovet.vision": {
    type: "object",
    additionalProperties: false,
    required: [
      "imageQuality",
      "visibleRegion",
      "visibleObservations",
      "apparentChanges",
      "attentionSigns",
      "urgencyLevel",
      "recommendedNextSteps",
      "limitations",
    ],
    properties: {
      imageQuality: { type: "string" },
      visibleRegion: { type: "string" },
      visibleObservations: { type: "array", items: { type: "string" } },
      apparentChanges: { type: "array", items: { type: "string" } },
      attentionSigns: { type: "array", items: { type: "string" } },
      urgencyLevel: { type: "string", enum: ["ROUTINE", "MONITOR", "SOON", "URGENT", "EMERGENCY"] },
      recommendedNextSteps: { type: "array", items: { type: "string" } },
      comparisonNotes: { type: ["string", "null"] },
      limitations: { type: "array", items: { type: "string" } },
    },
  },
  "eccovet.exams": {
    type: "object",
    additionalProperties: false,
    required: [
      "examName",
      "laboratory",
      "examDate",
      "speciesMentioned",
      "markers",
      "summary",
      "mainChanges",
      "vetTalkingPoints",
      "limitations",
    ],
    properties: {
      examName: { type: "string" },
      laboratory: { type: ["string", "null"] },
      examDate: { type: ["string", "null"] },
      speciesMentioned: { type: ["string", "null"] },
      markers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "value", "unit", "reference", "status"],
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            unit: { type: ["string", "null"] },
            reference: { type: ["string", "null"] },
            status: { type: "string", enum: ["WITHIN", "ABOVE", "BELOW", "UNAVAILABLE"] },
            confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            sourcePage: { type: ["integer", "null"] },
          },
        },
      },
      summary: { type: "string" },
      mainChanges: { type: "array", items: { type: "string" } },
      historicalNotes: { type: ["string", "null"] },
      vetTalkingPoints: { type: "array", items: { type: "string" } },
      limitations: { type: "array", items: { type: "string" } },
    },
  },
  "eccocheckup.assessment": {
    type: "object",
    additionalProperties: false,
    required: [
      "overview",
      "routine",
      "feeding",
      "activity",
      "prevention",
      "followUpPoints",
      "priorities",
      "nextSteps",
      "vetQuestions",
      "urgencyLevel",
      "limitations",
    ],
    properties: {
      overview: { type: "string" },
      routine: { type: "string" },
      feeding: { type: "string" },
      activity: { type: "string" },
      prevention: { type: "string" },
      followUpPoints: { type: "array", items: { type: "string" } },
      priorities: { type: "array", items: { type: "string" } },
      nextSteps: { type: "array", items: { type: "string" } },
      vetQuestions: { type: "array", items: { type: "string" } },
      accompanimentIndex: { type: ["number", "null"] },
      accompanimentMethod: { type: "string" },
      urgencyLevel: { type: "string", enum: ["ROUTINE", "MONITOR", "SOON", "URGENT", "EMERGENCY"] },
      limitations: { type: "array", items: { type: "string" } },
    },
  },
};

jsonSchemaByCapability.eccovet = jsonSchemaByCapability["eccovet.assessment"];
jsonSchemaByCapability.eccovet_vision = jsonSchemaByCapability["eccovet.vision"];
jsonSchemaByCapability.eccolab = jsonSchemaByCapability["eccovet.exams"];
jsonSchemaByCapability.eccocheckup = jsonSchemaByCapability["eccocheckup.assessment"];
jsonSchemaByCapability["eccovet.triage"] = jsonSchemaByCapability["eccovet.assessment"];
jsonSchemaByCapability["eccovet.report"] = jsonSchemaByCapability["eccovet.assessment"];
jsonSchemaByCapability["ecconutri.assessment"] = jsonSchemaByCapability["eccocheckup.assessment"];
jsonSchemaByCapability["eccopeso.assessment"] = jsonSchemaByCapability["eccocheckup.assessment"];
jsonSchemaByCapability["eccodental.vision"] = jsonSchemaByCapability["eccovet.vision"];
jsonSchemaByCapability["eccobehavior.assessment"] = jsonSchemaByCapability["eccocheckup.assessment"];
jsonSchemaByCapability["eccovacina.plan"] = jsonSchemaByCapability["eccovet.assessment"];
jsonSchemaByCapability["eccomed.review"] = jsonSchemaByCapability["eccovet.assessment"];
jsonSchemaByCapability["pethealth.profile"] = jsonSchemaByCapability["eccocheckup.assessment"];

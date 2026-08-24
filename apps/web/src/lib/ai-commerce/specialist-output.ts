import { z } from "zod";
import { CONFIDENCE_LEVELS, DIAGNOSTIC_STATUS } from "./provenance";
import { AI_COMMERCE_PRODUCTS } from "./catalog";

const urgencyEnum = z.enum(["ROUTINE", "MONITOR", "SOON", "URGENT", "EMERGENCY"]);

export function specialistNormalizeCapability(capabilityId: string): string {
  if (capabilityId === "eccovet" || capabilityId === "eccovet.assessment") return "eccovet.assessment";
  if (capabilityId === "eccovet_vision" || capabilityId === "eccovet.vision") return "eccovet.vision";
  if (capabilityId === "eccolab" || capabilityId === "eccovet.exams") return "eccovet.exams";
  if (capabilityId === "eccocheckup" || capabilityId === "eccocheckup.assessment") return "eccocheckup.assessment";
  return capabilityId;
}

export const evidenceItemSchema = z.object({
  statement: z.string(),
  source: z.string(),
  strength: z.enum(["HIGH", "MODERATE", "LOW"]),
});

export const differentialSchema = z.object({
  hypothesis: z.string(),
  likelihood: z.enum(["HIGH", "MODERATE", "LOW"]),
  supportingEvidence: z.array(z.string()),
  contradictoryEvidence: z.array(z.string()),
});

export const diagnosticImpressionSchema = z.object({
  status: z.enum([DIAGNOSTIC_STATUS.AI_IMPRESSION, DIAGNOSTIC_STATUS.NOT_APPLICABLE]),
  primaryHypothesis: z.string().nullable(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  confidenceScore: z.number().min(0).max(100).nullable(),
  rationale: z.string(),
  supportingPoints: z.array(z.string()),
  contradictoryPoints: z.array(z.string()),
  differentialDiagnoses: z.array(differentialSchema),
  missingInformation: z.array(z.string()),
  differentiationSteps: z.array(z.string()),
});

export const specialistBaseSchema = z.object({
  summary: z.string().min(1),
  clinicalOverview: z.string(),
  evidence: z.array(evidenceItemSchema),
  diagnosticImpression: diagnosticImpressionSchema,
  urgency: z.object({
    level: urgencyEnum,
    reasons: z.array(z.string()),
  }),
  recommendations: z.array(z.string()),
  nextSteps: z.array(z.string()),
  questionsForVeterinarian: z.array(z.string()),
  alerts: z.array(z.string()),
  watchFor: z.array(z.string()),
  limitations: z.array(z.string()),
  disclaimer: z.string(),
  missingInformation: z.array(z.string()),
});

export type SpecialistBaseOutput = z.infer<typeof specialistBaseSchema>;

const labMarker = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string().nullable(),
  reference: z.string().nullable(),
  status: z.enum(["WITHIN", "ABOVE", "BELOW", "UNAVAILABLE"]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  sourcePage: z.number().int().nullable().optional(),
});

export const specialistByCapability: Record<string, z.ZodTypeAny> = {
  "eccovet.assessment": specialistBaseSchema.extend({
    complaint: z.string(),
    relevantHistory: z.string(),
    observations: z.array(z.string()),
    attentionSigns: z.array(z.string()),
    possibleConsiderations: z.array(z.string()),
    recommendedNextSteps: z.array(z.string()),
    vetQuestions: z.array(z.string()),
    urgencyLevel: urgencyEnum,
  }),
  "eccovet.triage": specialistBaseSchema.extend({
    complaint: z.string(),
    observations: z.array(z.string()),
    attentionSigns: z.array(z.string()),
    recommendedNextSteps: z.array(z.string()),
    urgencyLevel: urgencyEnum,
    triageClass: z.enum(["EMERGENCY", "URGENT", "SOON", "ROUTINE"]),
    nowDo: z.array(z.string()),
    avoid: z.array(z.string()),
    takeWithYou: z.array(z.string()),
  }),
  "eccocheckup.assessment": specialistBaseSchema.extend({
    overview: z.string(),
    routine: z.string(),
    feeding: z.string(),
    activity: z.string(),
    prevention: z.string(),
    followUpPoints: z.array(z.string()),
    priorities: z.array(z.string()),
    accompanimentStatus: z.enum(["WELL_FOLLOWED", "REVIEW_POINTS", "INCOMPLETE", "ATTENTION"]),
    documented: z.array(z.string()),
    gaps: z.array(z.string()),
    checklist: z.array(z.string()),
    compatibleProductQueries: z.array(z.string()).optional(),
    urgencyLevel: urgencyEnum,
  }),
  "pethealth.profile": specialistBaseSchema.extend({
    overview: z.string(),
    healthBrief: z.string(),
    trends: z.array(z.string()),
    inconsistencies: z.array(z.string()),
    followUpPoints: z.array(z.string()),
    urgencyLevel: urgencyEnum,
  }),
  "eccovet.report": specialistBaseSchema.extend({
    complaint: z.string(),
    observations: z.array(z.string()),
    recommendedNextSteps: z.array(z.string()),
    urgencyLevel: urgencyEnum,
    reportType: z.string(),
    sourcesUsed: z.array(z.string()),
    timeline: z.array(z.string()),
    documentedFindings: z.array(z.string()),
    reportedInformation: z.array(z.string()),
    pendingItems: z.array(z.string()),
  }),
  "eccovet.exams": specialistBaseSchema.extend({
    examName: z.string(),
    laboratory: z.string().nullable(),
    examDate: z.string().nullable(),
    speciesMentioned: z.string().nullable(),
    markers: z.array(labMarker),
    mainChanges: z.array(z.string()),
    historicalNotes: z.string().nullable().optional(),
    vetTalkingPoints: z.array(z.string()),
  }),
  "eccovet.vision": specialistBaseSchema.extend({
    imageQuality: z.enum(["GOOD", "ACCEPTABLE", "POOR", "UNUSABLE"]),
    qualityIssues: z.array(z.string()),
    visibleRegion: z.string(),
    visibleObservations: z.array(z.string()),
    apparentChanges: z.array(z.string()),
    attentionSigns: z.array(z.string()),
    recommendedNextSteps: z.array(z.string()),
    urgencyLevel: urgencyEnum,
    newPhotoRecommended: z.boolean(),
    analyzedArea: z
      .object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        label: z.string(),
      })
      .nullable(),
  }),
  "eccodental.vision": specialistBaseSchema.extend({
    imageQuality: z.enum(["GOOD", "ACCEPTABLE", "POOR", "UNUSABLE"]),
    qualityIssues: z.array(z.string()),
    visibleRegion: z.string(),
    visibleObservations: z.array(z.string()),
    apparentChanges: z.array(z.string()),
    attentionSigns: z.array(z.string()),
    recommendedNextSteps: z.array(z.string()),
    urgencyLevel: urgencyEnum,
    oralSummary: z.string(),
    preventiveCare: z.array(z.string()),
    professionalItems: z.array(z.string()),
    newPhotoRecommended: z.boolean(),
  }),
  "ecconutri.assessment": specialistBaseSchema.extend({
    overview: z.string(),
    routine: z.string(),
    priorities: z.array(z.string()),
    followUpPoints: z.array(z.string()),
    dietProfile: z.string(),
    positives: z.array(z.string()),
    reviewPoints: z.array(z.string()),
    identifiedComposition: z.string().nullable(),
    suggestedOrganization: z.array(z.string()),
    transitionPlan: z.array(z.string()),
    foodDiary: z.array(z.string()),
    compatibleProductQueries: z.array(z.string()).optional(),
    urgencyLevel: urgencyEnum,
  }),
  "eccopeso.assessment": specialistBaseSchema.extend({
    overview: z.string(),
    routine: z.string(),
    prevention: z.string(),
    priorities: z.array(z.string()),
    trendNarrative: z.string(),
    associatedFactors: z.array(z.string()),
    monitoringPlan: z.array(z.string()),
    urgencyLevel: urgencyEnum,
  }),
  "eccobehavior.assessment": specialistBaseSchema.extend({
    overview: z.string(),
    priorities: z.array(z.string()),
    followUpPoints: z.array(z.string()),
    patterns: z.array(z.string()),
    triggers: z.array(z.string()),
    behavioralHypotheses: z.array(z.string()),
    environmentalFactors: z.array(z.string()),
    managementPlan: z.array(z.string()),
    enrichmentPlan: z.array(z.string()),
    abcNotes: z.string(),
    urgencyLevel: urgencyEnum,
  }),
  "eccovacina.plan": specialistBaseSchema.extend({
    complaint: z.string(),
    observations: z.array(z.string()),
    recommendedNextSteps: z.array(z.string()),
    urgencyLevel: urgencyEnum,
    extractedRecords: z.array(
      z.object({
        name: z.string(),
        date: z.string().nullable(),
        batch: z.string().nullable(),
        manufacturer: z.string().nullable(),
        establishment: z.string().nullable(),
        professional: z.string().nullable(),
        validity: z.string().nullable(),
        needsConfirmation: z.boolean(),
      })
    ),
    incompleteFields: z.array(z.string()),
    nextActions: z.array(z.string()),
  }),
  "eccomed.review": specialistBaseSchema.extend({
    complaint: z.string(),
    observations: z.array(z.string()),
    recommendedNextSteps: z.array(z.string()),
    urgencyLevel: urgencyEnum,
    medications: z.array(
      z.object({
        name: z.string(),
        form: z.string().nullable(),
        concentration: z.string().nullable(),
        doseWritten: z.string().nullable(),
        frequencyWritten: z.string().nullable(),
        schedule: z.string().nullable(),
        duration: z.string().nullable(),
        prescriber: z.string().nullable(),
        date: z.string().nullable(),
        needsConfirmation: z.boolean(),
      })
    ),
    incompleteAlerts: z.array(z.string()),
    administrationPlan: z.array(z.string()),
  }),
};

function strictObject(properties: Record<string, unknown>): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  };
}

const evidenceJson = {
  type: "array",
  items: strictObject({
    statement: { type: "string" },
    source: { type: "string" },
    strength: { type: "string", enum: ["HIGH", "MODERATE", "LOW"] },
  }),
};

const diagnosticJson = strictObject({
  status: { type: "string", enum: ["AI_DIAGNOSTIC_IMPRESSION", "NOT_APPLICABLE"] },
  primaryHypothesis: { type: ["string", "null"] },
  confidence: { type: "string", enum: [...CONFIDENCE_LEVELS] },
  confidenceScore: { type: ["number", "null"] },
  rationale: { type: "string" },
  supportingPoints: { type: "array", items: { type: "string" } },
  contradictoryPoints: { type: "array", items: { type: "string" } },
  differentialDiagnoses: {
    type: "array",
    items: strictObject({
      hypothesis: { type: "string" },
      likelihood: { type: "string", enum: ["HIGH", "MODERATE", "LOW"] },
      supportingEvidence: { type: "array", items: { type: "string" } },
      contradictoryEvidence: { type: "array", items: { type: "string" } },
    }),
  },
  missingInformation: { type: "array", items: { type: "string" } },
  differentiationSteps: { type: "array", items: { type: "string" } },
});

const urgencyJson = strictObject({
  level: { type: "string", enum: ["ROUTINE", "MONITOR", "SOON", "URGENT", "EMERGENCY"] },
  reasons: { type: "array", items: { type: "string" } },
});

const strings = { type: "array", items: { type: "string" } };
const urgencyLevel = { type: "string", enum: ["ROUTINE", "MONITOR", "SOON", "URGENT", "EMERGENCY"] };

function baseProperties(extra: Record<string, unknown>): Record<string, unknown> {
  return strictObject({
    summary: { type: "string" },
    clinicalOverview: { type: "string" },
    evidence: evidenceJson,
    diagnosticImpression: diagnosticJson,
    urgency: urgencyJson,
    recommendations: strings,
    nextSteps: strings,
    questionsForVeterinarian: strings,
    alerts: strings,
    watchFor: strings,
    limitations: strings,
    disclaimer: { type: "string" },
    missingInformation: strings,
    ...extra,
  });
}

const markerJson = {
  type: "array",
  items: strictObject({
    name: { type: "string" },
    value: { type: "string" },
    unit: { type: ["string", "null"] },
    reference: { type: ["string", "null"] },
    status: { type: "string", enum: ["WITHIN", "ABOVE", "BELOW", "UNAVAILABLE"] },
    confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
    sourcePage: { type: ["integer", "null"] },
  }),
};

export const specialistJsonByCapability: Record<string, Record<string, unknown>> = {
  "eccovet.assessment": baseProperties({
    complaint: { type: "string" },
    relevantHistory: { type: "string" },
    observations: strings,
    attentionSigns: strings,
    possibleConsiderations: strings,
    recommendedNextSteps: strings,
    vetQuestions: strings,
    urgencyLevel,
  }),
  "eccovet.triage": baseProperties({
    complaint: { type: "string" },
    observations: strings,
    attentionSigns: strings,
    recommendedNextSteps: strings,
    urgencyLevel,
    triageClass: { type: "string", enum: ["EMERGENCY", "URGENT", "SOON", "ROUTINE"] },
    nowDo: strings,
    avoid: strings,
    takeWithYou: strings,
  }),
  "eccocheckup.assessment": baseProperties({
    overview: { type: "string" },
    routine: { type: "string" },
    feeding: { type: "string" },
    activity: { type: "string" },
    prevention: { type: "string" },
    followUpPoints: strings,
    priorities: strings,
    accompanimentStatus: { type: "string", enum: ["WELL_FOLLOWED", "REVIEW_POINTS", "INCOMPLETE", "ATTENTION"] },
    documented: strings,
    gaps: strings,
    checklist: strings,
    compatibleProductQueries: strings,
    urgencyLevel,
  }),
  "pethealth.profile": baseProperties({
    overview: { type: "string" },
    healthBrief: { type: "string" },
    trends: strings,
    inconsistencies: strings,
    followUpPoints: strings,
    urgencyLevel,
  }),
  "eccovet.report": baseProperties({
    complaint: { type: "string" },
    observations: strings,
    recommendedNextSteps: strings,
    urgencyLevel,
    reportType: { type: "string" },
    sourcesUsed: strings,
    timeline: strings,
    documentedFindings: strings,
    reportedInformation: strings,
    pendingItems: strings,
  }),
  "eccovet.exams": baseProperties({
    examName: { type: "string" },
    laboratory: { type: ["string", "null"] },
    examDate: { type: ["string", "null"] },
    speciesMentioned: { type: ["string", "null"] },
    markers: markerJson,
    mainChanges: strings,
    historicalNotes: { type: ["string", "null"] },
    vetTalkingPoints: strings,
  }),
  "eccovet.vision": baseProperties({
    imageQuality: { type: "string", enum: ["GOOD", "ACCEPTABLE", "POOR", "UNUSABLE"] },
    qualityIssues: strings,
    visibleRegion: { type: "string" },
    visibleObservations: strings,
    apparentChanges: strings,
    attentionSigns: strings,
    recommendedNextSteps: strings,
    urgencyLevel,
    newPhotoRecommended: { type: "boolean" },
    analyzedArea: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["x", "y", "width", "height", "label"],
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        label: { type: "string" },
      },
    },
  }),
  "eccodental.vision": baseProperties({
    imageQuality: { type: "string", enum: ["GOOD", "ACCEPTABLE", "POOR", "UNUSABLE"] },
    qualityIssues: strings,
    visibleRegion: { type: "string" },
    visibleObservations: strings,
    apparentChanges: strings,
    attentionSigns: strings,
    recommendedNextSteps: strings,
    urgencyLevel,
    oralSummary: { type: "string" },
    preventiveCare: strings,
    professionalItems: strings,
    newPhotoRecommended: { type: "boolean" },
  }),
  "ecconutri.assessment": baseProperties({
    overview: { type: "string" },
    routine: { type: "string" },
    priorities: strings,
    followUpPoints: strings,
    dietProfile: { type: "string" },
    positives: strings,
    reviewPoints: strings,
    identifiedComposition: { type: ["string", "null"] },
    suggestedOrganization: strings,
    transitionPlan: strings,
    foodDiary: strings,
    compatibleProductQueries: strings,
    urgencyLevel,
  }),
  "eccopeso.assessment": baseProperties({
    overview: { type: "string" },
    routine: { type: "string" },
    prevention: { type: "string" },
    priorities: strings,
    trendNarrative: { type: "string" },
    associatedFactors: strings,
    monitoringPlan: strings,
    urgencyLevel,
  }),
  "eccobehavior.assessment": baseProperties({
    overview: { type: "string" },
    priorities: strings,
    followUpPoints: strings,
    patterns: strings,
    triggers: strings,
    behavioralHypotheses: strings,
    environmentalFactors: strings,
    managementPlan: strings,
    enrichmentPlan: strings,
    abcNotes: { type: "string" },
    urgencyLevel,
  }),
  "eccovacina.plan": baseProperties({
    complaint: { type: "string" },
    observations: strings,
    recommendedNextSteps: strings,
    urgencyLevel,
    extractedRecords: {
      type: "array",
      items: strictObject({
        name: { type: "string" },
        date: { type: ["string", "null"] },
        batch: { type: ["string", "null"] },
        manufacturer: { type: ["string", "null"] },
        establishment: { type: ["string", "null"] },
        professional: { type: ["string", "null"] },
        validity: { type: ["string", "null"] },
        needsConfirmation: { type: "boolean" },
      }),
    },
    incompleteFields: strings,
    nextActions: strings,
  }),
  "eccomed.review": baseProperties({
    complaint: { type: "string" },
    observations: strings,
    recommendedNextSteps: strings,
    urgencyLevel,
    medications: {
      type: "array",
      items: strictObject({
        name: { type: "string" },
        form: { type: ["string", "null"] },
        concentration: { type: ["string", "null"] },
        doseWritten: { type: ["string", "null"] },
        frequencyWritten: { type: ["string", "null"] },
        schedule: { type: ["string", "null"] },
        duration: { type: ["string", "null"] },
        prescriber: { type: ["string", "null"] },
        date: { type: ["string", "null"] },
        needsConfirmation: { type: "boolean" },
      }),
    },
    incompleteAlerts: strings,
    administrationPlan: strings,
  }),
};

export function specialistSchemaFor(capabilityId: string) {
  const id = specialistNormalizeCapability(capabilityId);
  return specialistByCapability[id] ?? specialistByCapability["eccovet.assessment"]!;
}

export function specialistJsonFor(capabilityId: string) {
  const id = specialistNormalizeCapability(capabilityId);
  return specialistJsonByCapability[id] ?? specialistJsonByCapability["eccovet.assessment"]!;
}

export function assertAllCapabilitiesHaveSpecialistSchema() {
  for (const product of AI_COMMERCE_PRODUCTS) {
    const id = specialistNormalizeCapability(product.capabilityId);
    if (!specialistByCapability[id] || !specialistJsonByCapability[id]) {
      throw new Error(`Missing specialist schema for ${product.capabilityId}`);
    }
  }
}

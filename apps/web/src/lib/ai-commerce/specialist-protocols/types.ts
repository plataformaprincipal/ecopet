import type { AiCommerceSku } from "../flags";
import type { AiWorkspaceKind } from "../catalog";

export type InterviewAnswerType = "text" | "textarea" | "chips" | "checkboxes" | "confirm" | "upload";

export type InterviewContext = {
  answers: Record<string, unknown>;
  petContext: Record<string, unknown> | null;
  petName: string;
};

export type InterviewQuestion = {
  id: string;
  prompt: string;
  helper?: string;
  type: InterviewAnswerType;
  options?: string[];
  when?: (ctx: InterviewContext) => boolean;
  skipIfKnown?: string;
  confirmIfKnown?: boolean;
  redFlagValues?: string[];
  interruptOnRedFlag?: boolean;
  uploadKind?: "vision" | "lab";
  accept?: string;
  multiple?: boolean;
  slots?: string[];
  required?: boolean;
};

export type SpecialistProtocol = {
  sku: AiCommerceSku;
  capabilityId: string;
  kind: AiWorkspaceKind;
  specialistTitle: string;
  specialistRole: string;
  intro: string;
  commercialValue: string;
  ctaLabel: string;
  minimumData: string[];
  questionTree: InterviewQuestion[];
  conditionalQuestions: string[];
  redFlags: string[];
  analysisInstructions: string;
  resultSections: string[];
  artifactConfig: {
    reportTitle: string;
    hasWorkbook: boolean;
    workbookSheets?: string[];
  };
  followUpPrompt: string;
  followUpSuggestions: string[];
};

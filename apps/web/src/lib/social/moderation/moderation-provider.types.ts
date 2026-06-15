export type ModerationDecision = {
  allowed: boolean;
  flags: string[];
  confidence?: number;
  provider: string;
};

export interface ModerationProvider {
  readonly name: string;
  analyzeContent(text: string): Promise<ModerationDecision>;
  analyzeImage?(url: string): Promise<ModerationDecision>;
}

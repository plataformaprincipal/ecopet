import { sanitizeAiUserText } from "@/lib/ai/utils/sanitize-input";

export function sanitizeAssistantUserInput(input: string): string {
  return sanitizeAiUserText(input).text;
}

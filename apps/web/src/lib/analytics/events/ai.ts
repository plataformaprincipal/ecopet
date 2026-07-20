import { defineEvent } from "./definitions";

export const AiEvents = {
  ASSISTANT_OPEN: defineEvent({
    event_name: "ai_assistant_open",
    category: "ai",
    action: "open",
    module: "ai",
  }),
  QUESTION: defineEvent({
    event_name: "ai_question_sent",
    category: "ai",
    action: "question",
    module: "ai",
  }),
  RESPONSE: defineEvent({
    event_name: "ai_response_received",
    category: "ai",
    action: "response",
    module: "ai",
  }),
  TOOL_USED: defineEvent({
    event_name: "ai_tool_used",
    category: "ai",
    action: "tool",
    module: "ai",
  }),
  ERROR: defineEvent({
    event_name: "ai_error",
    category: "ai",
    action: "error",
    module: "ai",
  }),
  LATENCY: defineEvent({
    event_name: "ai_response_time",
    category: "ai",
    action: "latency",
    module: "ai",
  }),
} as const;
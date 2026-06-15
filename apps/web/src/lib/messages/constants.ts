export const MESSAGE_MAX_LENGTH = 4000;
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const MESSAGE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const MESSAGE_RATE_LIMIT_MAX = 30;
export const CONVERSATIONS_POLL_MS = 15_000;
export const MESSAGES_POLL_MS = 5_000;
export const DEFAULT_PAGE_SIZE = 20;

export const CHAT_ATTACHMENT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

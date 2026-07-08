export const JOB_TYPES = [
  "SEND_EMAIL",
  "SEND_NOTIFICATION",
  "PROCESS_PAYMENT_WEBHOOK",
  "SYNC_INTEGRATION",
  "GENERATE_REPORT",
  "RUN_WORKFLOW",
  "AI_BACKGROUND_TASK",
  "EXPORT_DATA",
  "CLEANUP_OLD_LOGS",
  "REPROCESS_FAILED_JOB",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export type JobPayload = Record<string, unknown>;

import type { AiLogRecord } from "@/lib/ai/types";
import { writeAiPlatformLog, listPlatformLogs, getPlatformLogStats } from "@/lib/ai/logs/service";

/** @deprecated Use writeAiPlatformLog */
export async function writeAiLog(record: AiLogRecord): Promise<string> {
  return writeAiPlatformLog(record);
}

export async function listAiLogs(params: { userId?: string; limit?: number; adminView?: boolean }) {
  return listPlatformLogs(params);
}

export async function getAiLogStats(userId?: string) {
  return getPlatformLogStats(userId);
}

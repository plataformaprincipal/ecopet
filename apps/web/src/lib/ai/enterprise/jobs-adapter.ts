/**
 * Interfaces para filas futuras (BullMQ / Trigger.dev / Inngest / QStash).
 * Não implementa filas — apenas contratos + bridge para AIJob existente.
 */
import "server-only";

import { enqueueAiJob } from "@/lib/ai/ai-jobs";

export type EnterpriseJobBackend = "ai_job" | "bullmq" | "trigger" | "inngest" | "qstash";

export type EnterpriseJobPayload = {
  type: string;
  userId?: string;
  role?: string;
  data: Record<string, unknown>;
};

export interface EnterpriseJobQueue {
  readonly backend: EnterpriseJobBackend;
  enqueue(payload: EnterpriseJobPayload): Promise<{ id: string }>;
}

class AiJobBridge implements EnterpriseJobQueue {
  readonly backend = "ai_job" as const;
  async enqueue(payload: EnterpriseJobPayload) {
    const job = await enqueueAiJob({
      type: payload.type,
      userId: payload.userId,
      role: payload.role,
      payload: payload.data,
    });
    return { id: job.id };
  }
}

let queue: EnterpriseJobQueue = new AiJobBridge();

export function getEnterpriseJobQueue(): EnterpriseJobQueue {
  return queue;
}

/** Troca futura para BullMQ/Trigger/Inngest/QStash sem alterar callers. */
export function setEnterpriseJobQueue(next: EnterpriseJobQueue): void {
  queue = next;
}

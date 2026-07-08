import { prisma } from "@/lib/prisma";

export async function logJobEvent(jobId: string, message: string, metadata?: Record<string, unknown>) {
  return prisma.workflowExecutionLog.create({
    data: {
      instanceId: jobId,
      step: "job",
      status: "LOG",
      message,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  }).catch(() => null);
}

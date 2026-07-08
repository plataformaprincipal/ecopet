import { prisma } from "@/lib/prisma";

export async function logWorkflowStep(params: {
  instanceId: string;
  step: string;
  status: string;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.workflowExecutionLog.create({
    data: {
      instanceId: params.instanceId,
      step: params.step,
      status: params.status,
      message: params.message,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
    },
  });
}

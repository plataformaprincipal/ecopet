import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { JobPayload, JobType } from "./job-types";

export async function enqueueJob(params: {
  type: JobType | string;
  payload: JobPayload;
  scheduledAt?: Date;
  maxAttempts?: number;
}) {
  return prisma.jobQueue.create({
    data: {
      type: params.type,
      payload: JSON.parse(JSON.stringify(params.payload)) as Prisma.InputJsonValue,
      scheduledAt: params.scheduledAt ?? new Date(),
      maxAttempts: params.maxAttempts ?? 3,
      status: "PENDING",
    },
  });
}

export async function claimNextJob() {
  const job = await prisma.jobQueue.findFirst({
    where: { status: "PENDING", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
  });
  if (!job) return null;
  return prisma.jobQueue.update({
    where: { id: job.id },
    data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
  });
}

export async function completeJob(jobId: string) {
  return prisma.jobQueue.update({
    where: { id: jobId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}

export async function failJob(jobId: string, error: string, retry = true) {
  const job = await prisma.jobQueue.findUnique({ where: { id: jobId } });
  if (!job) return null;
  const shouldRetry = retry && job.attempts < job.maxAttempts;
  return prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? "RETRYING" : "FAILED",
      lastError: error,
      scheduledAt: shouldRetry ? new Date(Date.now() + 60000 * job.attempts) : job.scheduledAt,
    },
  });
}

export async function retryJob(jobId: string) {
  return prisma.jobQueue.update({
    where: { id: jobId },
    data: { status: "PENDING", scheduledAt: new Date(), lastError: null },
  });
}

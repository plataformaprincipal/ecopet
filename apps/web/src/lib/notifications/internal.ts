import { prisma } from "@/lib/prisma";

export async function createInternalNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      data: params.data ? JSON.parse(JSON.stringify(params.data)) : undefined,
    },
  });
}

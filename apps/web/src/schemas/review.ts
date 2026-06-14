import { z } from "zod";

export const serviceReviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

export const reviewModerationSchema = z.object({
  action: z.enum(["hide", "restore", "report"]),
  reason: z.string().optional().nullable(),
});

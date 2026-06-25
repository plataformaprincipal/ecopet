import type { Campaign } from "@prisma/client";

export type SerializedCampaign = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  goalAmount: number | null;
  raisedAmount: number;
  neededItems: string[];
  photos: string[];
  status: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeCampaign(c: Campaign): SerializedCampaign {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    urgency: c.urgency,
    goalAmount: c.goalAmount,
    raisedAmount: c.raisedAmount,
    neededItems: Array.isArray(c.neededItems) ? (c.neededItems as string[]) : [],
    photos: Array.isArray(c.photos) ? (c.photos as string[]) : [],
    status: c.status,
    deadline: c.deadline ? c.deadline.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export const CAMPAIGN_CATEGORIES = [
  "FOOD",
  "MEDICINE",
  "NEUTERING",
  "FOSTER",
  "RESCUE",
  "TRANSPORT",
  "EVENT",
  "MAINTENANCE",
] as const;

export const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export const CAMPAIGN_URGENCIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

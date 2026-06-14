import type { ProfileInsight } from "../types";

type ProfileListItem = { label: string; value: string; badge?: string; href?: string };
type SmartWidget = { id: string; label: string; value: string; trend?: string; href?: string };

export const NGO_PROFILE = {
  name: "",
  avatar: "",
  coverImage: "",
  bio: "",
  location: "",
  subtitle: "",
  metrics: [] as { label: string; value: string | number }[],
  campaigns: [] as never[],
  adoptions: [] as never[],
  donations: [] as never[],
};

export const NGO_CAMPAIGNS: never[] = [];
export const NGO_ADOPTIONS: never[] = [];
export const NGO_SOCIAL: ProfileListItem[] = [];
export const NGO_RESCUE: ProfileListItem[] = [];
export const NGO_DONATIONS: ProfileListItem[] = [];
export const NGO_OPERATIONS: ProfileListItem[] = [];
export const NGO_AI_INSIGHTS: ProfileInsight[] = [];
export const NGO_WIDGETS: SmartWidget[] = [];
export const NGO_IMPACT = {
  adoptions2026: 0,
  livesSaved: 0,
  donationsTotal: "R$ 0",
  transparencyScore: "0%",
  reports: [] as { title: string; status: string; date: string }[],
};

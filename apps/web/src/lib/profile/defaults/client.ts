import type { ChartDataPoint, ProfileInsight } from "../types";

type SocialStat = { label: string; value: string | number };
type DigitalActivity = { label: string; value: string | number };
type TimelineEvent = { date: string; event: string; type: string };
type Achievement = { name: string; desc: string; unlocked: boolean };
type ProfileListItem = { label: string; value: string; badge?: string; href?: string };
type SmartWidget = { id: string; label: string; value: string; trend?: string; href?: string };

export const CLIENT_PETS: { id: string; name: string; breed: string; age: string; photo: string; weight: string; healthStatus: string }[] = [];
export const CLIENT_ORDERS: ProfileListItem[] = [];
export const CLIENT_WALLET = { balance: 0, points: 0 };
export const CLIENT_PROFILE = {
  name: "",
  avatar: "",
  coverImage: "",
  bio: "",
  location: "",
  subtitle: "",
  metrics: [] as SocialStat[],
  pets: [] as typeof CLIENT_PETS,
  orders: [] as ProfileListItem[],
  favorites: [] as ProfileListItem[],
  activities: [] as ProfileListItem[],
};
export const CLIENT_SOCIAL_FEED: ProfileListItem[] = [];
export const CLIENT_INTELLIGENT_WIDGETS: SmartWidget[] = [];
export const CLIENT_AI_INSIGHTS: ProfileInsight[] = [];
export const CLIENT_FINANCIAL: ProfileListItem[] = [];
export const CLIENT_SERVICES: ProfileListItem[] = [];
export const CLIENT_SETTINGS: ProfileListItem[] = [];
export const CLIENT_CHART_DATA: ChartDataPoint[] = [];
export const CLIENT_SOCIAL_STATS: SocialStat[] = [];
export const CLIENT_DIGITAL_LIFE = {
  rewards: { level: "", points: 0, cashback: "" },
  activities: [] as DigitalActivity[],
  timeline: [] as TimelineEvent[],
  achievements: [] as Achievement[],
};

import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Compass,
  Users,
  Heart,
  Stethoscope,
  Apple,
  Search,
  ShoppingBag,
  Scissors,
  Building2,
  CalendarDays,
} from "lucide-react";

export type SocialFilterId =
  | "my-feed"
  | "for-you"
  | "following"
  | "adoption"
  | "health"
  | "food"
  | "lost"
  | "marketplace"
  | "services"
  | "ongs"
  | "events";

export type SocialFilter = {
  id: SocialFilterId;
  /** Chave i18n em social.filters.* */
  labelKey: string;
  icon: LucideIcon;
  /** Tipo de post no backend (SocialPostType). */
  type?: string;
  /** Ordenação especial via /api/public/posts. */
  sort?: "popular";
};

export const SOCIAL_FILTERS: SocialFilter[] = [
  { id: "my-feed", labelKey: "social.filters.myFeed", icon: Sparkles },
  { id: "for-you", labelKey: "social.filters.forYou", icon: Compass, sort: "popular" },
  { id: "following", labelKey: "social.filters.following", icon: Users },
  { id: "adoption", labelKey: "social.filters.adoption", icon: Heart, type: "ADOPTION" },
  { id: "health", labelKey: "social.filters.health", icon: Stethoscope, type: "EDUCATIONAL" },
  { id: "food", labelKey: "social.filters.food", icon: Apple, type: "GENERAL" },
  { id: "lost", labelKey: "social.filters.lost", icon: Search, type: "RESCUE" },
  { id: "marketplace", labelKey: "social.filters.marketplace", icon: ShoppingBag, type: "PRODUCT" },
  { id: "services", labelKey: "social.filters.services", icon: Scissors, type: "SERVICE" },
  { id: "ongs", labelKey: "social.filters.ongs", icon: Building2, type: "CAMPAIGN" },
  { id: "events", labelKey: "social.filters.events", icon: CalendarDays, type: "EVENT" },
];

export const DEFAULT_SOCIAL_FILTER = SOCIAL_FILTERS[0];

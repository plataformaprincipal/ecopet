"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CalendarDays,
  Compass,
  Headset,
  Heart,
  MapPin,
  Megaphone,
  MessageCircle,
  Package,
  PenLine,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Tag,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import type { CapabilityIconKey } from "@/lib/ai/capabilities/registry";

export const CAPABILITY_ICON_MAP: Record<CapabilityIconKey, LucideIcon> = {
  compass: Compass,
  stethoscope: Stethoscope,
  "shopping-bag": ShoppingBag,
  "calendar-days": CalendarDays,
  "map-pin": MapPin,
  plane: Plane,
  heart: Heart,
  "pen-line": PenLine,
  "message-circle": MessageCircle,
  users: Users,
  package: Package,
  tag: Tag,
  warehouse: Warehouse,
  "calendar-clock": CalendarClock,
  wallet: Wallet,
  megaphone: Megaphone,
  headset: Headset,
  "shield-check": ShieldCheck,
};

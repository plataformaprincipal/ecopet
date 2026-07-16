"use client";

import { PrimaryBottomNav } from "@/components/shared/navigation/primary-bottom-nav";

export function PublicMobileNav() {
  return <PrimaryBottomNav context="public" />;
}

/** Alias histórico */
export const PublicBottomNav = PublicMobileNav;

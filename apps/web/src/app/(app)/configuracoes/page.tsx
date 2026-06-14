"use client";

import { Suspense } from "react";
import { SettingsHub } from "@/components/features/settings/settings-hub";

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="skeleton-shimmer m-4 h-96 rounded-[16px]" />}>
      <SettingsHub />
    </Suspense>
  );
}

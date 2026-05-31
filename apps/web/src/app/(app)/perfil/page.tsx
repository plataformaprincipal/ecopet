"use client";

import { Suspense } from "react";
import { SmartProfileHub } from "@/components/profile/smart-profile-hub";

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 m-4 rounded-2xl bg-ecopet-gray/10" />}>
      <SmartProfileHub />
    </Suspense>
  );
}

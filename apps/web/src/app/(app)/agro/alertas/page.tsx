"use client";

import { AgroPageWrapper } from "@/components/features/agro/agro-page-wrapper";
import { AgroAlertsContent } from "@/components/features/agro/agro-sections-content";

export default function Page() {
  return <AgroPageWrapper title="Alertas"><AgroAlertsContent /></AgroPageWrapper>;
}

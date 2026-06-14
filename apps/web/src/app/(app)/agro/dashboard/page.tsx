"use client";

import { AgroPageWrapper } from "@/components/features/agro/agro-page-wrapper";
import { AgroDashboardContent } from "@/components/features/agro/agro-dashboard-content";

export default function AgroDashboardPage() {
  return (
    <AgroPageWrapper title="Dashboard Agro">
      <AgroDashboardContent />
    </AgroPageWrapper>
  );
}

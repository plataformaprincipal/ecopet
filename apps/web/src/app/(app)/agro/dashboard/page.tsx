"use client";

import { AgroPageWrapper } from "@/components/agro/agro-page-wrapper";
import { AgroDashboardContent } from "@/components/agro/agro-dashboard-content";

export default function AgroDashboardPage() {
  return (
    <AgroPageWrapper title="Dashboard Agro">
      <AgroDashboardContent />
    </AgroPageWrapper>
  );
}

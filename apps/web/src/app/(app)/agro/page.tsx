"use client";

import { AgroPageWrapper } from "@/components/features/agro/agro-page-wrapper";
import { AgroHomeContent } from "@/components/features/agro/agro-dashboard-content";

export default function AgroPage() {
  return (
    <AgroPageWrapper title="Agro Inteligente">
      <AgroHomeContent />
    </AgroPageWrapper>
  );
}

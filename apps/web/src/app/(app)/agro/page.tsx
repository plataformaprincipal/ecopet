"use client";

import { AgroPageWrapper } from "@/components/agro/agro-page-wrapper";
import { AgroHomeContent } from "@/components/agro/agro-dashboard-content";

export default function AgroPage() {
  return (
    <AgroPageWrapper title="Agro Inteligente">
      <AgroHomeContent />
    </AgroPageWrapper>
  );
}

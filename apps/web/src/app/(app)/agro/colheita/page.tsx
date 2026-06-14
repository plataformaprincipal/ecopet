"use client";

import { AgroPageWrapper } from "@/components/features/agro/agro-page-wrapper";
import { AgroHarvestContent } from "@/components/features/agro/agro-sections-content";

export default function Page() {
  return <AgroPageWrapper title="Colheita"><AgroHarvestContent /></AgroPageWrapper>;
}

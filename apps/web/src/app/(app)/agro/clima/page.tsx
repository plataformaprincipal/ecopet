"use client";

import { AgroPageWrapper } from "@/components/features/agro/agro-page-wrapper";
import { AgroWeatherContent } from "@/components/features/agro/agro-sections-content";

export default function Page() {
  return <AgroPageWrapper title="Clima"><AgroWeatherContent /></AgroPageWrapper>;
}

"use client";

import { Suspense } from "react";
import { AgroPageWrapper } from "@/components/agro/agro-page-wrapper";
import { AgroFarmsContent } from "@/components/agro/agro-farms-content";

export default function AgroFazendasPage() {
  return (
    <AgroPageWrapper title="Fazendas">
      <Suspense><AgroFarmsContent /></Suspense>
    </AgroPageWrapper>
  );
}

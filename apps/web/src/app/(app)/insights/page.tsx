"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { EcoPetInsightsDashboard } from "@/components/ecosystem/insights/ecopet-insights-dashboard";

function InsightsContent() {
  const searchParams = useSearchParams();
  const scope = (searchParams.get("scope") as "network" | "partner" | "client" | "ngo") ?? "network";
  return <EcoPetInsightsDashboard scope={scope} />;
}

export default function InsightsPage() {
  return (
    <>
      <AppHeader title="Métricas & Insights" />
      <main className="mx-auto max-w-7xl flex-1 p-4 lg:p-6">
        <Suspense fallback={<div className="animate-pulse h-96 rounded-2xl bg-ecopet-gray/10" />}>
          <InsightsContent />
        </Suspense>
      </main>
    </>
  );
}

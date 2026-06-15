"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { void params.then((p) => setReportId(p.reportId)); }, [params]);

  useEffect(() => {
    if (!reportId) return;
    fetch(`/api/admin/messages/reports/${reportId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setReport(j.data.report); });
  }, [reportId]);

  async function review(status: string) {
    await fetch(`/api/admin/messages/reports/${reportId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, hideMessage: status === "RESOLVED" }),
    });
    router.push("/dashboard/admin/messages/reports");
  }

  if (!report) return <p className="p-6">Carregando...</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-bold">Revisar denúncia</h1>
      <pre className="rounded bg-muted p-3 text-xs overflow-auto">{JSON.stringify(report, null, 2)}</pre>
      <div className="flex gap-2">
        <Button onClick={() => review("RESOLVED")}>Resolver</Button>
        <Button variant="outline" onClick={() => review("REJECTED")}>Rejeitar</Button>
      </div>
    </div>
  );
}

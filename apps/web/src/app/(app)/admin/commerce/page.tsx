"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/features/admin/ui/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Payload = {
  counts: Record<string, number>;
  recentCases: Array<{ id: string; sku: string; status: string; crmv: string | null }>;
  recentEnrollments: Array<{ id: string; sku: string; status: string; amountCents: number }>;
  splitReady: boolean;
  entertainment: { sku: string; status: string; billingEnabled: boolean };
};

export default function AdminCommercePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/commerce", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.error?.message ?? "Falha");
      })
      .catch(() => setError("Falha ao carregar"));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader title="Comércio catalogado" description="Assinaturas, casos clínicos, proteção e entretenimento. Split real permanece desligado." />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data
          ? Object.entries(data.counts).map(([k, v]) => (
              <Card key={k}>
                <CardHeader>
                  <CardTitle className="text-sm">{k}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{v}</CardContent>
              </Card>
            ))
          : null}
      </div>
      <p className="text-sm">splitReady={String(data?.splitReady ?? false)} · entretenimento {data?.entertainment.status} billing={String(data?.entertainment.billingEnabled)}</p>
      <Card>
        <CardHeader>
          <CardTitle>Casos recentes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {data?.recentCases.map((c) => (
            <p key={c.id}>
              {c.sku} · {c.status} {c.crmv ? `· CRMV ${c.crmv}` : ""}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

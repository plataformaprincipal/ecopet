"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Report = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  post?: { id: string; content: string } | null;
  comment?: { id: string; content: string } | null;
};

export function AdminSocialReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social/reports", { credentials: "include" });
      const body = await res.json();
      if (body.success) setReports(body.data.reports);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string, status: string) {
    await fetch(`/api/admin/social/reports/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolution: status }),
    });
    load();
  }

  if (loading) return <p>Carregando denúncias...</p>;
  if (!reports.length) return <p className="text-muted-foreground">Nenhuma denúncia aberta.</p>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded border p-4">
          <p className="text-sm font-medium">{r.reason} — {r.status}</p>
          <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("pt-BR")}</p>
          <p className="mt-2 text-sm">{r.post?.content ?? r.comment?.content ?? "—"}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => resolve(r.id, "RESOLVED")}>
              Resolver
            </Button>
            <Button size="sm" variant="outline" onClick={() => resolve(r.id, "REJECTED")}>
              Rejeitar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
